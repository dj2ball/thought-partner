import json
import asyncio
from typing import Dict, Any
from openai import AsyncOpenAI
from ...config import settings
from ...models import Recipe
from ..base_runner import BaseRunner

MAX_CONCURRENT_CALLS = 5
_semaphore = asyncio.Semaphore(MAX_CONCURRENT_CALLS)


class SingleShotRunner(BaseRunner):
    """Direct LLM call with profile injection for simple generation tasks"""
    
    async def run(self, recipe: Recipe, inputs: Dict[str, Any]) -> Dict[str, Any]:
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        
        # Build system prompt with profile injection
        system_prompt = self.build_system_prompt(recipe.system_prompt or "")
        
        # Build user prompt from template
        user_prompt = self.safe_template_replace(recipe.user_prompt_template, inputs)
        
        # Determine response format
        response_format = {"type": "json_object"}
        if recipe.response_format and "schema" in recipe.response_format:
            response_format = {
                "type": "json_schema",
                "json_schema": {
                    "name": f"{recipe.id}_response",
                    "schema": recipe.response_format["schema"],
                    "strict": True
                }
            }
        
        async with _semaphore:
            response = await client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format=response_format
            )
        
        result = json.loads(response.choices[0].message.content)

        return {
            "recipe_id": recipe.id,
            "mode": "single_shot",
            "output": result,
            "methodology": recipe.methodology if hasattr(recipe, 'methodology') and recipe.methodology else None,
            "meta": {"runner_type": "single_shot"}
        }