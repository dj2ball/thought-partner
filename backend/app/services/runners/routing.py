import json
import asyncio
from typing import Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser, BaseOutputParser
from ...config import settings
from ...models import Recipe
from ..base_runner import BaseRunner

MAX_CONCURRENT_CALLS = 5
_semaphore = asyncio.Semaphore(MAX_CONCURRENT_CALLS)


class CustomRouterOutputParser(BaseOutputParser):
    """Simple router output parser"""
    
    def parse(self, text: str) -> Dict[str, Any]:
        # Simple parsing - look for route name in the response
        text = text.strip().lower()
        return {"destination": text, "next_inputs": {}}


class RoutingRunner(BaseRunner):
    """Custom routing implementation for classification then specialized processing"""
    
    async def run(self, recipe: Recipe, inputs: Dict[str, Any]) -> Dict[str, Any]:
        if not recipe.workflow or recipe.workflow.type != "routing":
            raise ValueError("Recipe must have workflow.type='routing'")
        
        workflow = recipe.workflow
        routing_config = workflow.router
        
        # Phase 1: Route classification
        route = await self._classify_route(routing_config, inputs, recipe)
        
        # Phase 2: Execute specialized processing
        result = await self._execute_route(route, routing_config, inputs, recipe)
        
        return {
            "recipe_id": recipe.id,
            "mode": "routing",
            "output": result,
            "route": route,
            "meta": {
                "runner_type": "routing",
                "selected_route": route.get("destination", "unknown")
            }
        }
    
    async def _classify_route(self, config: Dict[str, Any], inputs: Dict[str, Any], 
                            recipe: Recipe) -> Dict[str, Any]:
        """Classify input to determine processing route"""
        classifier_config = config.get("classifier", {})
        
        llm = ChatOpenAI(model=settings.openai_model, temperature=0.1)
        
        # Build destinations from available routes
        destinations = []
        route_configs = config.get("routes", [])
        
        for route_config in route_configs:
            route_name = route_config.get("name", "route")
            route_description = route_config.get("description", "")
            destinations.append(f"{route_name}: {route_description}")
        
        # Create router prompt
        router_template = classifier_config.get("prompt", 
            """Given the user input, classify it into one of the following categories:
            
            {destinations}
            
            Input: {input}
            
            Respond with ONLY the category name that best matches the input.""")
        
        # Build routing prompt
        context = {
            "destinations": "\n".join(destinations),
            "input": self._build_classification_input(inputs, classifier_config)
        }
        
        router_prompt = PromptTemplate.from_template(router_template)
        parser = CustomRouterOutputParser()
        
        async with _semaphore:
            chain = router_prompt | llm | parser
            route_result = await chain.ainvoke(context)
        
        return route_result
    
    async def _execute_route(self, route: Dict[str, Any], config: Dict[str, Any], 
                           inputs: Dict[str, Any], recipe: Recipe) -> Dict[str, Any]:
        """Execute the specialized processing for the selected route"""
        route_name = route.get("destination", "default")
        
        # Find route configuration
        route_config = None
        for r in config.get("routes", []):
            if r.get("name") == route_name:
                route_config = r
                break
        
        if not route_config:
            # Fallback to default route
            route_config = config.get("default_route", {})
        
        # Determine processing type
        processing_type = route_config.get("type", "simple")
        
        if processing_type == "chain":
            return await self._execute_chain_route(route_config, inputs, recipe)
        elif processing_type == "parallel":
            return await self._execute_parallel_route(route_config, inputs, recipe)
        else:
            return await self._execute_simple_route(route_config, inputs, recipe)
    
    async def _execute_simple_route(self, route_config: Dict[str, Any], 
                                   inputs: Dict[str, Any], recipe: Recipe) -> Dict[str, Any]:
        """Execute simple single-step route"""
        llm = ChatOpenAI(model=settings.openai_model, temperature=route_config.get("temperature", 0.7))
        
        system_prompt = self.build_system_prompt(recipe.system_prompt or "")
        route_prompt = self.safe_template_replace(route_config.get("prompt", ""), inputs)
        
        # Build full prompt
        full_prompt = PromptTemplate.from_template(system_prompt + "\n\n" + route_prompt)
        parser = JsonOutputParser()
        
        async with _semaphore:
            chain = full_prompt | llm | parser
            result = await chain.ainvoke(inputs)
        
        return result
    
    async def _execute_chain_route(self, route_config: Dict[str, Any], 
                                  inputs: Dict[str, Any], recipe: Recipe) -> Dict[str, Any]:
        """Execute multi-step chain route"""
        steps = route_config.get("steps", [])
        context = inputs.copy()
        step_results = []
        
        llm = ChatOpenAI(model=settings.openai_model, temperature=route_config.get("temperature", 0.7))
        system_prompt = self.build_system_prompt(recipe.system_prompt or "")
        
        for i, step in enumerate(steps):
            step_name = step.get("name", f"step_{i+1}")
            step_prompt = step.get("prompt", "")
            
            # Build full prompt with system context
            full_prompt = system_prompt + "\n\n" + step_prompt
            full_prompt = self.safe_template_replace(full_prompt, context)
            
            prompt_template = PromptTemplate.from_template(full_prompt)
            parser = JsonOutputParser()
            
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
        
        return step_results[-1]["output"] if step_results else {}
    
    async def _execute_parallel_route(self, route_config: Dict[str, Any], 
                                     inputs: Dict[str, Any], recipe: Recipe) -> Dict[str, Any]:
        """Execute parallel processing route"""
        branches = route_config.get("branches", [])
        
        llm = ChatOpenAI(model=settings.openai_model, temperature=route_config.get("temperature", 0.7))
        system_prompt = self.build_system_prompt(recipe.system_prompt or "")
        
        async def execute_branch(branch: Dict[str, Any]) -> Dict[str, Any]:
            branch_prompt = self.safe_template_replace(branch.get("prompt", ""), inputs)
            full_prompt = system_prompt + "\n\n" + branch_prompt
            
            prompt_template = PromptTemplate.from_template(full_prompt)
            parser = JsonOutputParser()
            
            async with _semaphore:
                chain = prompt_template | llm | parser
                result = await chain.ainvoke(inputs)
            
            return {
                "branch": branch.get("name", "branch"),
                "output": result
            }
        
        # Execute all branches in parallel
        branch_results = await asyncio.gather(*[execute_branch(branch) for branch in branches])
        
        # Synthesize if configured
        if route_config.get("synthesis"):
            synthesis_prompt = route_config["synthesis"].get("prompt", "")
            context = {
                **inputs,
                "branch_results": json.dumps(branch_results, ensure_ascii=False)
            }
            synthesis_prompt = self.safe_template_replace(synthesis_prompt, context)
            
            full_prompt = system_prompt + "\n\n" + synthesis_prompt
            prompt_template = PromptTemplate.from_template(full_prompt)
            parser = JsonOutputParser()
            
            async with _semaphore:
                chain = prompt_template | llm | parser
                synthesis = await chain.ainvoke(context)
            
            return synthesis
        
        return {"branches": branch_results}
    
    def _build_classification_input(self, inputs: Dict[str, Any], 
                                   classifier_config: Dict[str, Any]) -> str:
        """Build input text for classification"""
        input_template = classifier_config.get("input_template", "{input}")
        
        # Use primary input field or combine multiple fields
        if "input" in inputs:
            return inputs["input"]
        elif "problem" in inputs:
            return inputs["problem"]
        else:
            # Combine all string inputs
            input_parts = []
            for key, value in inputs.items():
                if isinstance(value, str) and key != "user_id":
                    input_parts.append(f"{key}: {value}")
            return "; ".join(input_parts)