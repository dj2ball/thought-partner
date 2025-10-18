import json
import asyncio
from typing import Dict, Any, List
from openai import AsyncOpenAI
from ...config import settings
from ...models import Recipe
from ..base_runner import BaseRunner

MAX_CONCURRENT_CALLS = 5
_semaphore = asyncio.Semaphore(MAX_CONCURRENT_CALLS)


class OrchestratorRunner(BaseRunner):
    """Planner→Workers→Synthesizer pattern with dynamic worker allocation"""
    
    async def run(self, recipe: Recipe, inputs: Dict[str, Any]) -> Dict[str, Any]:
        if not recipe.workflow or recipe.workflow.type != "orchestrator":
            raise ValueError("Recipe must have workflow.type='orchestrator'")
        
        workflow = recipe.workflow
        orchestrator_config = workflow.orchestrator
        
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        system_prompt = self.build_system_prompt(recipe.system_prompt or "")
        
        # Phase 1: Planning
        plan = await self._run_planner(client, system_prompt, orchestrator_config, inputs, recipe)
        
        # Phase 2: Worker execution (parallel)
        worker_results = await self._run_workers(client, system_prompt, orchestrator_config, 
                                                plan, inputs, recipe)
        
        # Phase 3: Synthesis
        synthesis = await self._run_synthesizer(client, system_prompt, orchestrator_config, 
                                              plan, worker_results, inputs, recipe)
        
        return {
            "recipe_id": recipe.id,
            "mode": "orchestrator",
            "output": synthesis,
            "plan": plan,
            "worker_results": worker_results,
            "meta": {
                "runner_type": "orchestrator",
                "workers_executed": len(worker_results)
            }
        }
    
    async def _run_planner(self, client, system_prompt: str, config: Dict[str, Any], 
                          inputs: Dict[str, Any], recipe: Recipe) -> Dict[str, Any]:
        """Run planner to determine work allocation"""
        planner_config = config.get("planner", {})
        planner_prompt = self.safe_template_replace(planner_config.get("prompt", ""), inputs)
        
        response_format = {"type": "json_object"}
        if planner_config.get("schema"):
            response_format = {
                "type": "json_schema",
                "json_schema": {
                    "name": f"{recipe.id}_plan",
                    "schema": planner_config["schema"],
                    "strict": True
                }
            }
        
        async with _semaphore:
            response = await client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": planner_prompt}
                ],
                response_format=response_format
            )
        
        return json.loads(response.choices[0].message.content)
    
    async def _run_workers(self, client, system_prompt: str, config: Dict[str, Any], 
                          plan: Dict[str, Any], inputs: Dict[str, Any], 
                          recipe: Recipe) -> List[Dict[str, Any]]:
        """Execute workers in parallel based on plan"""
        workers_config = config.get("workers", {})
        
        # Determine workers to execute based on plan
        workers_to_run = self._determine_workers(plan, workers_config)
        
        async def execute_worker(worker_spec: Dict[str, Any]) -> Dict[str, Any]:
            worker_name = worker_spec.get("name", "worker")
            worker_prompt = worker_spec.get("prompt", "")
            
            # Build context for worker
            context = {
                **inputs,
                "plan": json.dumps(plan, ensure_ascii=False),
                "worker_context": json.dumps(worker_spec.get("context", {}), ensure_ascii=False)
            }
            worker_prompt = self.safe_template_replace(worker_prompt, context)
            
            response_format = {"type": "json_object"}
            if worker_spec.get("schema"):
                response_format = {
                    "type": "json_schema",
                    "json_schema": {
                        "name": f"{recipe.id}_{worker_name}",
                        "schema": worker_spec["schema"],
                        "strict": True
                    }
                }
            
            async with _semaphore:
                response = await client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": worker_prompt}
                    ],
                    response_format=response_format,
                    temperature=worker_spec.get("temperature", 0.7)
                )
            
            return {
                "worker": worker_name,
                "output": json.loads(response.choices[0].message.content),
                "context": worker_spec.get("context", {})
            }
        
        # Execute all workers in parallel
        worker_results = await asyncio.gather(*[execute_worker(worker) for worker in workers_to_run])
        return worker_results
    
    async def _run_synthesizer(self, client, system_prompt: str, config: Dict[str, Any], 
                             plan: Dict[str, Any], worker_results: List[Dict[str, Any]], 
                             inputs: Dict[str, Any], recipe: Recipe) -> Dict[str, Any]:
        """Synthesize worker results into final output"""
        synthesizer_config = config.get("synthesizer", {})
        synthesizer_prompt = synthesizer_config.get("prompt", "")
        
        # Build context for synthesizer
        context = {
            **inputs,
            "plan": json.dumps(plan, ensure_ascii=False),
            "worker_results": json.dumps(worker_results, ensure_ascii=False)
        }
        synthesizer_prompt = self.safe_template_replace(synthesizer_prompt, context)
        
        response_format = {"type": "json_object"}
        if synthesizer_config.get("schema"):
            response_format = {
                "type": "json_schema",
                "json_schema": {
                    "name": f"{recipe.id}_synthesis",
                    "schema": synthesizer_config["schema"],
                    "strict": True
                }
            }
        
        async with _semaphore:
            response = await client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": synthesizer_prompt}
                ],
                response_format=response_format
            )
        
        return json.loads(response.choices[0].message.content)
    
    def _determine_workers(self, plan: Dict[str, Any], workers_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Determine which workers to execute based on plan"""
        workers_to_run = []
        
        # Check if plan specifies workers directly
        if "workers" in plan:
            planned_workers = plan["workers"]
            available_workers = workers_config.get("available", [])
            
            for planned_worker in planned_workers:
                worker_name = planned_worker.get("name") if isinstance(planned_worker, dict) else planned_worker
                
                # Find matching worker template
                for worker_template in available_workers:
                    if worker_template.get("name") == worker_name:
                        worker_spec = worker_template.copy()
                        if isinstance(planned_worker, dict):
                            worker_spec["context"] = planned_worker.get("context", {})
                        workers_to_run.append(worker_spec)
                        break
        else:
            # Use default workers if no specific plan
            workers_to_run = workers_config.get("default", workers_config.get("available", []))
        
        return workers_to_run