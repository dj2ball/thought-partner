import json
import asyncio
from typing import Dict, Any, List
from openai import AsyncOpenAI
from ...config import settings
from ...models import Recipe
from ..base_runner import BaseRunner

MAX_CONCURRENT_CALLS = 5
_semaphore = asyncio.Semaphore(MAX_CONCURRENT_CALLS)


class ChainRunner(BaseRunner):
    """Sequential chain execution with optional LangChain or native OpenAI support"""

    async def run(self, recipe: Recipe, inputs: Dict[str, Any]) -> Dict[str, Any]:
        if not recipe.workflow or recipe.workflow.type != "chain":
            raise ValueError("Recipe must have workflow.type='chain'")

        # Route to LangChain or native implementation based on config
        if settings.use_langchain:
            return await self._run_with_langchain(recipe, inputs)
        else:
            return await self._run_native(recipe, inputs)

    async def _run_native(self, recipe: Recipe, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Native OpenAI implementation (default, more reliable with JSON)"""
        workflow = recipe.workflow
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        temperature = workflow.chain.temperature if workflow.chain and hasattr(workflow.chain, 'temperature') and workflow.chain.temperature is not None else 0.7

        # Build system prompt with profile injection
        base_system_prompt = self.build_system_prompt(recipe.system_prompt or "")

        # Execute chain steps sequentially
        context = inputs.copy()
        step_results = []

        for i, step in enumerate(workflow.chain.steps if workflow.chain else []):
            step_id = step.get("id", step.get("name", f"step_{i+1}"))
            step_role = step.get("role", "")
            step_system_prompt = step.get("system_prompt", "")
            step_user_prompt = step.get("user_prompt", step.get("prompt", ""))

            # Build system prompt with step-specific additions
            if step_system_prompt:
                full_system_prompt = base_system_prompt + "\n\n" + step_system_prompt
            else:
                full_system_prompt = base_system_prompt

            # Replace template variables in user prompt
            user_prompt = self.safe_template_replace(step_user_prompt, context)

            # Determine response format
            response_format = {"type": "json_object"}
            if step.get("response_schema"):
                response_format = {
                    "type": "json_schema",
                    "json_schema": {
                        "name": f"{recipe.id}_{step_id}",
                        "schema": step["response_schema"],
                        "strict": True
                    }
                }

            # Execute step
            async with _semaphore:
                response = await client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[
                        {"role": "system", "content": full_system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format=response_format,
                    temperature=temperature
                )

            # Parse response
            step_result = json.loads(response.choices[0].message.content)

            step_results.append({
                "step": step_id,
                "output": step_result
            })

            # Add step result to context for next step
            # Make step output available as step.{step_id}.output
            context[f"step.{step_id}.output"] = step_result
            if isinstance(step_result, dict):
                # Also add individual keys for easier access
                for key, value in step_result.items():
                    context[f"step.{step_id}.{key}"] = value

        # Prepare final result
        final_output = step_results[-1]["output"] if step_results else {}

        return {
            "recipe_id": recipe.id,
            "mode": "chain",
            "output": final_output,
            "steps": step_results,
            "methodology": recipe.methodology if hasattr(recipe, 'methodology') and recipe.methodology else None,
            "meta": {
                "runner_type": "chain",
                "total_steps": len(step_results),
                "execution_mode": "native"
            }
        }

    async def _run_with_langchain(self, recipe: Recipe, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """LangChain implementation (optional, enable with USE_LANGCHAIN=true)"""
        # TODO: Implement LangChain version if needed
        # Challenge: LangChain PromptTemplate can't handle literal JSON in prompts
        # Solution: Would need to escape JSON examples or use different approach
        raise NotImplementedError(
            "LangChain mode not yet implemented for ChainRunner. "
            "Set USE_LANGCHAIN=false in .env to use native OpenAI implementation."
        )