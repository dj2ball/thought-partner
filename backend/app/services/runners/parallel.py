import json
import asyncio
from typing import Dict, Any, List
from openai import AsyncOpenAI
from ...config import settings
from ...models import Recipe
from ..base_runner import BaseRunner

MAX_CONCURRENT_CALLS = 5
_semaphore = asyncio.Semaphore(MAX_CONCURRENT_CALLS)


class ParallelRunner(BaseRunner):
    """Custom parallel execution with branching and voting support"""
    
    async def run(self, recipe: Recipe, inputs: Dict[str, Any]) -> Dict[str, Any]:
        if not recipe.workflow or recipe.workflow.type != "parallel":
            raise ValueError("Recipe must have workflow.type='parallel'")
        
        workflow = recipe.workflow
        parallel_config = workflow.parallel
        
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        system_prompt = self.build_system_prompt(recipe.system_prompt or "")
        
        if parallel_config.mode == "branching":
            # Different prompts executed in parallel
            results = await self._run_branching(client, system_prompt, parallel_config, inputs, recipe)
        else:
            # Same prompt with varied parameters (voting)
            results = await self._run_voting(client, system_prompt, parallel_config, inputs, recipe)
        
        return {
            "recipe_id": recipe.id,
            "mode": "parallel",
            "output": results.get("synthesis", results.get("branches", results.get("votes", []))),
            "parallel_results": results,
            "meta": {
                "runner_type": "parallel",
                "parallel_mode": getattr(parallel_config, 'mode', 'voting')
            }
        }
    
    async def _run_branching(self, client, system_prompt: str, config, 
                           inputs: Dict[str, Any], recipe: Recipe) -> Dict[str, Any]:
        """Execute different prompts in parallel"""
        branches = getattr(config, 'branches', [])
        
        async def execute_branch(branch: Dict[str, Any]) -> Dict[str, Any]:
            branch_prompt = self.safe_template_replace(branch.get("prompt", ""), inputs)
            
            response_format = {"type": "json_object"}
            if branch.get("response_schema"):
                response_format = {
                    "type": "json_schema",
                    "json_schema": {
                        "name": f"{recipe.id}_{branch.get('name', 'branch')}",
                        "schema": branch["response_schema"],
                        "strict": True
                    }
                }
            
            async with _semaphore:
                response = await client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": branch_prompt}
                    ],
                    response_format=response_format,
                    temperature=branch.get("temperature", 0.7)
                )
            
            return {
                "name": branch.get("name", "branch"),
                "output": json.loads(response.choices[0].message.content)
            }
        
        # Execute all branches in parallel
        branch_results = await asyncio.gather(*[execute_branch(branch) for branch in branches])
        
        result = {"branches": branch_results}
        
        # Run synthesis if configured
        if config.synthesis:
            synthesis = await self._run_synthesis(client, system_prompt, config.synthesis, 
                                                branch_results, inputs, recipe)
            result["synthesis"] = synthesis
        
        return result
    
    async def _run_voting(self, client, system_prompt: str, config, 
                        inputs: Dict[str, Any], recipe: Recipe) -> Dict[str, Any]:
        """Execute same prompt with temperature variance for diversity"""
        base_prompt = self.safe_template_replace(getattr(config, 'prompt', ''), inputs)
        vote_count = getattr(config, 'votes', 3)
        temperature_range = getattr(config, 'temperature_range', [0.3, 0.9])
        
        async def execute_vote(vote_idx: int) -> Dict[str, Any]:
            # Vary temperature for diversity
            temperature = temperature_range[0] + (temperature_range[1] - temperature_range[0]) * (vote_idx / max(1, vote_count - 1))
            
            response_format = {"type": "json_object"}
            if hasattr(config, 'response_schema') and config.response_schema:
                response_format = {
                    "type": "json_schema",
                    "json_schema": {
                        "name": f"{recipe.id}_vote_{vote_idx}",
                        "schema": config.response_schema,
                        "strict": True
                    }
                }
            
            async with _semaphore:
                response = await client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": base_prompt}
                    ],
                    response_format=response_format,
                    temperature=temperature
                )
            
            return {
                "vote": vote_idx + 1,
                "temperature": temperature,
                "output": json.loads(response.choices[0].message.content)
            }
        
        # Execute all votes in parallel
        vote_results = await asyncio.gather(*[execute_vote(i) for i in range(vote_count)])
        
        result = {"votes": vote_results}
        
        # Run synthesis if configured
        if config.synthesis:
            synthesis = await self._run_synthesis(client, system_prompt, config.synthesis, 
                                                vote_results, inputs, recipe)
            result["synthesis"] = synthesis
        
        return result
    
    async def _run_synthesis(self, client, system_prompt: str, synthesis_config,
                           parallel_results: List[Dict[str, Any]], inputs: Dict[str, Any], 
                           recipe: Recipe) -> Dict[str, Any]:
        """Synthesize parallel results into final output"""
        synthesis_prompt = synthesis_config.get('prompt', '')
        
        # Prepare context for synthesis
        context = inputs.copy()
        context["parallel_results"] = json.dumps(parallel_results, ensure_ascii=False)
        
        synthesis_prompt = self.safe_template_replace(synthesis_prompt, context)
        
        response_format = {"type": "json_object"}
        if synthesis_config.get("response_schema"):
            response_format = {
                "type": "json_schema", 
                "json_schema": {
                    "name": f"{recipe.id}_synthesis",
                    "schema": synthesis_config["response_schema"],
                    "strict": True
                }
            }
        
        async with _semaphore:
            response = await client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": synthesis_prompt}
                ],
                response_format=response_format
            )
        
        return json.loads(response.choices[0].message.content)