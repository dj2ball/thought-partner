import json
import asyncio
from typing import Dict, Any, List
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser, BaseOutputParser
from langchain_openai import ChatOpenAI
from ...config import settings
from ...models import Recipe
from ..base_runner import BaseRunner

MAX_CONCURRENT_CALLS = 5
_semaphore = asyncio.Semaphore(MAX_CONCURRENT_CALLS)


class SchemaValidatedParser(BaseOutputParser):
    """Custom output parser with schema validation"""
    
    def __init__(self, schema: Dict[str, Any] = None):
        super().__init__()
        self.schema = schema
    
    def parse(self, text: str) -> Dict[str, Any]:
        try:
            result = json.loads(text)
            # TODO: Add JSON schema validation here if needed
            return result
        except json.JSONDecodeError:
            return {"error": "Invalid JSON response", "raw_text": text}


class ChainRunner(BaseRunner):
    """Uses LangChain SequentialChain for cumulative context building"""
    
    async def run(self, recipe: Recipe, inputs: Dict[str, Any]) -> Dict[str, Any]:
        if not recipe.workflow or recipe.workflow.type != "chain":
            raise ValueError("Recipe must have workflow.type='chain'")
        
        workflow = recipe.workflow
        llm = ChatOpenAI(
            model=settings.openai_model, 
            temperature=workflow.chain.get("temperature", 0.7) if workflow.chain else 0.7
        )
        
        # Build system prompt with profile injection
        system_prompt = self.build_system_prompt(recipe.system_prompt or "")
        
        # Execute chain steps sequentially
        context = inputs.copy()
        step_results = []
        
        for i, step in enumerate(workflow.chain.get("steps", [])):
            step_name = step.get("name", f"step_{i+1}")
            step_prompt = step.get("prompt", "")
            
            # Build full prompt with system context
            full_prompt = system_prompt + "\n\n" + step_prompt
            full_prompt = self.safe_template_replace(full_prompt, context)
            
            # Determine parser and response format
            parser = JsonOutputParser()
            if step.get("schema"):
                parser = SchemaValidatedParser(step["schema"])
            
            # Create and execute chain step
            prompt_template = PromptTemplate.from_template(full_prompt)
            
            async with _semaphore:
                chain = prompt_template | llm | parser
                step_result = await chain.ainvoke(context)
            
            step_results.append({
                "step": step_name,
                "output": step_result
            })
            
            # Add step result to context for next step
            if isinstance(step_result, dict):
                context.update(step_result)
            else:
                context[step_name] = step_result
        
        # Prepare final result
        final_output = step_results[-1]["output"] if step_results else {}
        
        return {
            "recipe_id": recipe.id,
            "mode": "chain",
            "output": final_output,
            "steps": step_results,
            "meta": {
                "runner_type": "chain",
                "total_steps": len(step_results)
            }
        }