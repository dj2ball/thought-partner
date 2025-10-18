import json
import asyncio
from typing import Dict, Any, List
from openai import AsyncOpenAI
from ...config import settings
from ...models import Recipe
from ..base_runner import BaseRunner

MAX_CONCURRENT_CALLS = 5
_semaphore = asyncio.Semaphore(MAX_CONCURRENT_CALLS)


class IterativeRunner(BaseRunner):
    """Enhanced version of current iterative system with state management and conditional execution"""
    
    async def run(self, recipe: Recipe, inputs: Dict[str, Any]) -> Dict[str, Any]:
        if not recipe.iterative:
            raise ValueError("Recipe must have iterative configuration")
        
        it = recipe.iterative
        count = inputs.get("loops", it.default_loops)
        if count > it.max_loops:
            raise ValueError(f"Requested loops ({count}) exceed max_loops ({it.max_loops})")
        
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        system_prompt = self.build_system_prompt(recipe.system_prompt or "")
        
        # Initialize state
        state = it.initial_state.copy() if it.initial_state else {}
        for k, v in list(state.items()):
            if isinstance(v, str):
                state[k] = self.safe_template_replace(v, inputs)
        
        history = []
        
        for i in range(1, count + 1):
            # Check exit conditions
            if await self._should_exit(state, it.get("exit_conditions", []), i):
                break
            
            entry = {"loop": i, "substeps": []}
            
            if it.substeps:
                # Multi-agent substeps
                for si, sub in enumerate(it.substeps, start=1):
                    role = sub.get("role", f"agent_{si}")
                    
                    # Check if this substep should be executed conditionally
                    if not await self._should_execute_substep(sub, state, i):
                        continue
                    
                    step_result = await self._execute_substep(
                        client, system_prompt, sub, role, state, inputs, i, si, recipe, it
                    )
                    
                    entry["substeps"].append({"role": role, "output": step_result})
                    
                    # Update state based on step result
                    state = self._update_state(state, step_result, i, si)
                
                history.append(entry)
            else:
                # Single step per loop
                step_result = await self._execute_single_step(
                    client, system_prompt, it, state, inputs, i, recipe
                )
                
                history.append(step_result)
                state = self._update_state(state, step_result, i)
        
        # Run final synthesis if configured
        final_synthesis_result = None
        if it.final_synthesis and it.final_synthesis.get("enabled", False):
            try:
                final_synthesis_result = await self._run_final_synthesis(
                    client, system_prompt, recipe, inputs, history, state
                )
            except Exception as e:
                print(f"Error in final synthesis: {e}")
        
        result = {
            "recipe_id": recipe.id,
            "mode": "iterative",
            "loops": len(history),
            "history": history,
            "final_state": state,
            "meta": {"runner_type": "iterative"}
        }
        
        if final_synthesis_result:
            result["final_synthesis"] = final_synthesis_result
        
        # Add markdown rendering if configured
        if recipe.ui_preferences and recipe.ui_preferences.get("render_as_markdown"):
            result["markdown"] = self._render_markdown(history, final_synthesis_result)
        
        return result
    
    async def _should_exit(self, state: Dict[str, Any], exit_conditions: List[Dict[str, Any]], 
                          loop_num: int) -> bool:
        """Check if iteration should exit early based on conditions"""
        for condition in exit_conditions:
            condition_type = condition.get("type")
            
            if condition_type == "state_value":
                key = condition.get("key")
                value = condition.get("value")
                if state.get(key) == value:
                    return True
            
            elif condition_type == "max_loops":
                max_val = condition.get("value", 10)
                if loop_num >= max_val:
                    return True
            
            # Add more condition types as needed
        
        return False
    
    async def _should_execute_substep(self, substep: Dict[str, Any], state: Dict[str, Any], 
                                    loop_num: int) -> bool:
        """Check if substep should be executed based on conditions"""
        conditions = substep.get("conditions", [])
        
        for condition in conditions:
            condition_type = condition.get("type")
            
            if condition_type == "state_exists":
                key = condition.get("key")
                if key not in state:
                    return False
            
            elif condition_type == "loop_range":
                min_loop = condition.get("min", 1)
                max_loop = condition.get("max", float('inf'))
                if not (min_loop <= loop_num <= max_loop):
                    return False
        
        return True
    
    async def _execute_substep(self, client, system_prompt: str, substep: Dict[str, Any], 
                             role: str, state: Dict[str, Any], inputs: Dict[str, Any], 
                             loop_num: int, substep_num: int, recipe: Recipe, 
                             it_config) -> Dict[str, Any]:
        """Execute a single substep"""
        prompt_template = substep.get("prompt", it_config.loop_prompt_template or "{state}")
        guard = (it_config.language_guardrails + "\n\n") if it_config.language_guardrails else ""
        
        # Build prompt with context
        loop_prompt = guard + prompt_template
        context = {
            **inputs,
            "loop": str(loop_num),
            "state": json.dumps(state, ensure_ascii=False),
            "params": json.dumps(inputs, ensure_ascii=False),
            "role": role
        }
        loop_prompt = self.safe_template_replace(loop_prompt, context)
        
        # Determine response format
        response_format = {"type": "json_object"}
        schema = substep.get("schema")
        if not schema and substep_num == len(it_config.substeps or []) and it_config.step_response_schema:
            schema = it_config.step_response_schema
        
        if schema:
            response_format = {
                "type": "json_schema",
                "json_schema": {
                    "name": f"{recipe.id}_sub_{substep_num}",
                    "schema": schema,
                    "strict": True
                }
            }
        
        async with _semaphore:
            response = await client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": loop_prompt}
                ],
                response_format=response_format
            )
        
        return json.loads(response.choices[0].message.content)
    
    async def _execute_single_step(self, client, system_prompt: str, it_config, 
                                 state: Dict[str, Any], inputs: Dict[str, Any], 
                                 loop_num: int, recipe: Recipe) -> Dict[str, Any]:
        """Execute a single iteration step"""
        guard = (it_config.language_guardrails + "\n\n") if it_config.language_guardrails else ""
        loop_prompt = guard + (it_config.loop_prompt_template or "{state}")
        
        context = {
            **inputs,
            "loop": str(loop_num),
            "state": json.dumps(state, ensure_ascii=False),
            "params": json.dumps(inputs, ensure_ascii=False)
        }
        loop_prompt = self.safe_template_replace(loop_prompt, context)
        
        response_format = {"type": "json_object"}
        if it_config.step_response_schema:
            response_format = {
                "type": "json_schema",
                "json_schema": {
                    "name": f"{recipe.id}_step",
                    "schema": it_config.step_response_schema,
                    "strict": True
                }
            }
        
        async with _semaphore:
            response = await client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": loop_prompt}
                ],
                response_format=response_format
            )
        
        return json.loads(response.choices[0].message.content)
    
    def _update_state(self, state: Dict[str, Any], step_result: Dict[str, Any], 
                     loop_num: int, substep_num: int = None) -> Dict[str, Any]:
        """Update state based on step result"""
        if isinstance(step_result, dict) and "next_state" in step_result:
            if isinstance(step_result["next_state"], dict):
                return step_result["next_state"]
        
        # Fallback: add step result to state
        key = f"loop_{loop_num}"
        if substep_num is not None:
            key += f"_sub_{substep_num}"
        
        return {**state, key: step_result}
    
    async def _run_final_synthesis(self, client, system_prompt: str, recipe: Recipe, 
                                 inputs: Dict[str, Any], history: List[Dict[str, Any]], 
                                 final_state: Dict[str, Any]) -> Dict[str, Any]:
        """Run final synthesis to consolidate all iterations"""
        synthesis_config = recipe.iterative.final_synthesis
        
        # Create iteration summary
        iteration_summary = self._create_iteration_summary(history)
        
        # Format synthesis prompt
        synthesis_prompt = synthesis_config["prompt"]
        context = {
            **inputs,
            "iteration_summary": iteration_summary,
            "final_state": json.dumps(final_state, ensure_ascii=False)
        }
        synthesis_prompt = self.safe_template_replace(synthesis_prompt, context)
        
        # Determine response format
        response_format = {"type": "json_object"}
        if "response_schema" in synthesis_config:
            response_format = {
                "type": "json_schema",
                "json_schema": {
                    "name": f"{recipe.id}_final_synthesis",
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
    
    def _create_iteration_summary(self, history: List[Dict[str, Any]]) -> str:
        """Create summary of all iterations"""
        summary = ""
        for i, entry in enumerate(history, 1):
            summary += f"\n--- Iteration {i} ---\n"
            
            if "substeps" in entry:
                for substep in entry.get("substeps", []):
                    role = substep.get("role", "Agent")
                    output = substep.get("output", {})
                    
                    if isinstance(output, dict):
                        content_parts = []
                        for key, value in output.items():
                            if key != "next_state" and value:
                                if isinstance(value, list):
                                    for item in value:
                                        if isinstance(item, dict) and "title" in item:
                                            content_parts.append(f"{item.get('title', '')}: {item.get('why', item.get('description', ''))}")
                                        else:
                                            content_parts.append(str(item))
                                else:
                                    content_parts.append(str(value))
                        
                        content = "; ".join(content_parts) if content_parts else json.dumps(output, ensure_ascii=False)[:200]
                        summary += f"🔸 {role}: {content}\n"
                    else:
                        summary += f"🔸 {role}: {str(output)[:200]}\n"
            else:
                summary += f"🔸 Result: {json.dumps(entry, ensure_ascii=False)[:200]}\n"
        
        return summary
    
    def _render_markdown(self, history: List[Dict[str, Any]], 
                        final_synthesis: Dict[str, Any] = None) -> str:
        """Render iterations as markdown"""
        lines = []
        
        for entry in history:
            loop_no = entry.get("loop")
            lines.append(f"## 🧩 Loop {loop_no}")
            
            substeps = entry.get("substeps", [])
            for step in substeps:
                role = step.get("role", "Agent")
                out = step.get("output", {})
                
                # Special rendering for debate format
                if role.lower().startswith("optimist") and isinstance(out, dict) and "proposals" in out:
                    for p in out.get("proposals", []):
                        title = p.get("title", "Idea")
                        why = p.get("why", "")
                        lines.append(f"### 🟢 {role}\n**Proposal:** *{title}*\n> {why}\n")
                elif role.lower().startswith("skeptic") and isinstance(out, dict) and "critiques" in out:
                    for c in out.get("critiques", []):
                        target = c.get("target", "")
                        risk = c.get("risk", c.get("issue", ""))
                        evidence = c.get("evidence", "")
                        ev_text = f" (evidence: {evidence})" if evidence else ""
                        lines.append(f"### 🔴 {role}\n**Critique:** *{target}*\n> {risk}{ev_text}\n")
                elif role.lower().startswith("mediator") and isinstance(out, dict) and "synthesis" in out:
                    for s in out.get("synthesis", []):
                        direction = s.get("direction", "Synthesis")
                        trade_off = s.get("trade_off", "")
                        lines.append(f"### ⚪ {role}\n**Synthesis:** *{direction}*\n> Trade-off: {trade_off}\n")
                else:
                    snippet = json.dumps(out, ensure_ascii=False, indent=2)
                    lines.append(f"### {role}\n```\n{snippet}\n```\n")
                
                lines.append("---")
        
        # Add final synthesis if available
        if final_synthesis:
            lines.append("\n## 🎯 Final Synthesis\n")
            if "executive_summary" in final_synthesis:
                lines.append(f"### Executive Summary\n{final_synthesis['executive_summary']}\n")
            
            if "validated_opportunities" in final_synthesis:
                lines.append("### 💡 Validated Opportunities")
                for opp in final_synthesis["validated_opportunities"]:
                    lines.append(f"**{opp.get('title', 'Opportunity')}**")
                    lines.append(f"*Rationale:* {opp.get('rationale', '')}")
                    lines.append(f"*Risks:* {opp.get('risks', '')}\n")
        
        return "\n".join(lines)