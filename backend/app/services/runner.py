import json, asyncio, pathlib, json as _json
from typing import Dict, Any
from ..config import settings
from ..models import Recipe
from ..models_user import UserProfile
from openai import AsyncOpenAI

MAX_CONCURRENT_CALLS = 5
_semaphore = asyncio.Semaphore(MAX_CONCURRENT_CALLS)

def profile_to_system(profile: UserProfile) -> str:
    return (
        "User Preferences:\n"
        f"- Goals: {', '.join(profile.goals)}\n"
        f"- Domains: {', '.join(profile.domains)}\n"
        f"- Tone: {profile.preferred_tone}; Detail: {profile.detail}\n"
        f"- Output formats: {', '.join(profile.output_formats)}\n"
        f"- Cognitive: div={profile.cognitive.divergent}, big={profile.cognitive.big_picture}, "
        f"speed={profile.cognitive.speed_over_evidence}, risk={profile.cognitive.risk_tolerance}, visual={profile.cognitive.visual_pref}\n"
        f"- Step-by-step: {profile.step_by_step}; Citations: {profile.wants_citations}\n"
        f"- Constraints: {profile.constraints}\n"
        f"- Notes: {profile.style_notes or '—'}\n"
        "Follow these when applying any recipe."
    )

def load_profile(user_id: str | None) -> UserProfile | None:
    if not user_id: return None
    # Look for profile in profiles directory
    p = pathlib.Path("profiles") / f"{user_id}.json"
    if not p.exists(): return None
    try:
        return UserProfile(**_json.loads(p.read_text(encoding='utf-8')))
    except Exception as e:
        print(f"Error loading profile for {user_id}: {e}")
        return None

def _render_markdown_from_history(history: list[dict]) -> str:
    lines: list[str] = []
    for entry in history:
        loop_no = entry.get("loop")
        lines.append(f"## 🧩 Loop {loop_no}")
        substeps = entry.get("substeps", [])
        for step in substeps:
            role = step.get("role", "Agent")
            out = step.get("output", {})
            if isinstance(role, str) and role.lower().startswith("optimist") and isinstance(out, dict) and "proposals" in out:
                for p in out.get("proposals", []):
                    title = p.get("title","Idea"); why = p.get("why","")
                    lines.append(f"### 🟢 {role}\n**Proposal:** *{title}*\n> {why}\n")
            elif isinstance(role, str) and role.lower().startswith("skeptic") and isinstance(out, dict) and "critiques" in out:
                for c in out.get("critiques", []):
                    tgt = c.get("target",""); risk = c.get("risk", c.get("issue","")); ev = c.get("evidence","")
                    ev_text = f" (evidence: {ev})" if ev else ""
                    lines.append(f"### 🔴 {role}\n**Critique:** *{tgt}*\n> {risk}{ev_text}\n")
            elif isinstance(role, str) and role.lower().startswith("mediator") and isinstance(out, dict) and "synthesis" in out:
                for s in out.get("synthesis", []):
                    direction = s.get("direction","Synthesis"); to = s.get("trade_off","")
                    lines.append(f"### ⚪ {role}\n**Synthesis:** *{direction}*\n> Trade-off: {to}\n")
            else:
                snippet = json.dumps(out, ensure_ascii=False, indent=2)
                lines.append(f"### {role}\n```\n{snippet}\n```\n")
            lines.append("---")
    return "\n".join(lines)

def _create_iteration_summary(recipe: Recipe, history: list) -> str:
    """Create a generic summary of iterations that works for any recipe"""
    summary = ""
    for i, entry in enumerate(history, 1):
        summary += f"\n--- Iteration {i} ---\n"
        
        if "substeps" in entry:
            # Multi-agent format
            for substep in entry.get("substeps", []):
                role = substep.get("role", "Agent")
                output = substep.get("output", {})
                
                # Try to extract meaningful content from output
                if isinstance(output, dict):
                    # Look for common patterns in output
                    content_parts = []
                    for key, value in output.items():
                        if key != "next_state" and value:  # Skip state updates
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
            # Single-step format
            summary += f"🔸 Result: {json.dumps(entry, ensure_ascii=False)[:200]}\n"
    
    return summary

def _create_debate_summary(history: list) -> str:
    """Specialized summary for debate-style recipes"""
    summary = ""
    for i, entry in enumerate(history, 1):
        summary += f"\n--- Loop {i} ---\n"
        for substep in entry.get("substeps", []):
            role = substep.get("role", "Agent")
            output = substep.get("output", {})
            if role == "Optimist" and "proposals" in output:
                for p in output["proposals"]:
                    summary += f"💡 {role}: {p.get('title', '')} - {p.get('why', '')}\n"
            elif role == "Skeptic" and "critiques" in output:
                for c in output["critiques"]:
                    summary += f"⚠️ {role}: {c.get('risk', '')} (re: {c.get('target', '')})\n"
            elif role == "Mediator" and "synthesis" in output:
                for s in output["synthesis"]:
                    summary += f"⚖️ {role}: {s.get('direction', '')} (trade-off: {s.get('trade_off', '')})\n"
    return summary

def _create_research_summary(history: list) -> str:
    """Specialized summary for research-style recipes"""
    summary = ""
    for i, entry in enumerate(history, 1):
        summary += f"\n--- Research Phase {i} ---\n"
        for substep in entry.get("substeps", []):
            role = substep.get("role", "Researcher")
            output = substep.get("output", {})
            if isinstance(output, dict):
                if "findings" in output:
                    for finding in output.get("findings", []):
                        summary += f"🔬 {role}: {finding}\n"
                elif "insights" in output:
                    for insight in output.get("insights", []):
                        summary += f"💡 {role}: {insight}\n"
                else:
                    summary += f"📋 {role}: {json.dumps(output, ensure_ascii=False)[:150]}\n"
    return summary

async def run_final_synthesis(recipe: Recipe, params: Dict[str, Any], history: list, final_state: dict, system_prompt: str, client):
    """Run final synthesis step to consolidate all iterative loops - works for any recipe"""
    synthesis_config = recipe.iterative.final_synthesis
    
    # Create generic iteration summary from history
    iteration_summary = _create_iteration_summary(recipe, history)
    
    # Use custom summary builder if provided, otherwise use generic one
    if "summary_builder" in synthesis_config:
        summary_builder = synthesis_config["summary_builder"]
        if summary_builder == "debate_format":
            iteration_summary = _create_debate_summary(history)
        elif summary_builder == "research_format":
            iteration_summary = _create_research_summary(history)
        # Add more format types as needed
    
    # Format the final synthesis prompt with generic placeholders
    synthesis_prompt = synthesis_config["prompt"]
    
    # Replace generic placeholders
    for key, value in params.items():
        synthesis_prompt = synthesis_prompt.replace(f"{{{key}}}", str(value))
    
    # Replace iteration-specific placeholders
    synthesis_prompt = synthesis_prompt.replace("{iteration_summary}", iteration_summary)
    synthesis_prompt = synthesis_prompt.replace("{debate_summary}", iteration_summary)  # Backward compatibility
    synthesis_prompt = synthesis_prompt.replace("{final_state}", json.dumps(final_state, ensure_ascii=False))
    
    # Run final synthesis
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
        r = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": synthesis_prompt}
            ],
            response_format=response_format
        )
    
    return json.loads(r.choices[0].message.content)

def _render_final_synthesis_markdown(synthesis_result: dict) -> str:
    """Render final synthesis as markdown"""
    lines = ["\n## 🎯 Final Synthesis\n"]
    
    if "executive_summary" in synthesis_result:
        lines.append(f"### Executive Summary\n{synthesis_result['executive_summary']}\n")
    
    if "validated_opportunities" in synthesis_result:
        lines.append("### 💡 Validated Opportunities")
        for opp in synthesis_result["validated_opportunities"]:
            lines.append(f"**{opp.get('title', 'Opportunity')}**")
            lines.append(f"*Rationale:* {opp.get('rationale', '')}")
            lines.append(f"*Risks:* {opp.get('risks', '')}\n")
    
    if "critical_insights" in synthesis_result:
        lines.append("### 🔍 Critical Insights")
        for insight in synthesis_result["critical_insights"]:
            lines.append(f"- {insight}")
        lines.append("")
    
    if "recommended_actions" in synthesis_result:
        lines.append("### 📋 Recommended Actions")
        for action in synthesis_result["recommended_actions"]:
            priority_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(action.get("priority", "medium"), "⚪")
            lines.append(f"{priority_emoji} **{action.get('action', '')}**")
            lines.append(f"*Timeline:* {action.get('timeline', '')}\n")
    
    return "\n".join(lines)

async def run_one_shot(recipe: Recipe, params: Dict[str, Any]) -> str:
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    profile = load_profile(params.get("user_id"))
    sys = (profile_to_system(profile) + "\n\n" if profile else "") + (recipe.system_prompt or "")
    
    # Safe string replacement for user prompt
    user = recipe.user_prompt_template
    for key, value in params.items():
        user = user.replace(f"{{{key}}}", str(value))
    async with _semaphore:
        r = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": sys},
                {"role": "user", "content": user}
            ],
            response_format={"type": "json_object"}
        )
    return r.choices[0].message.content

async def run_iterative_generic(recipe: Recipe, params: Dict[str, Any], loops: int | None) -> str:
    it = recipe.iterative
    if not it: raise ValueError("Recipe does not define an iterative configuration.")
    count = loops or it.default_loops
    if count > it.max_loops: raise ValueError(f"Requested loops ({count}) exceed max_loops ({it.max_loops}).")
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    # Get user profile and create system prompt
    profile = load_profile(params.get("user_id"))
    system_prompt = (profile_to_system(profile) + "\n\n" if profile else "") + (recipe.system_prompt or "")

    state = it.initial_state.copy() if it.initial_state else {}
    for k, v in list(state.items()):
        if isinstance(v, str):
            try: 
                # Safe string replacement
                for param_key, param_value in params.items():
                    v = v.replace(f"{{{param_key}}}", str(param_value))
                state[k] = v
            except Exception: 
                pass

    history = []
    for i in range(1, count + 1):
        entry = {"loop": i, "substeps": []}
        if it.substeps:
            for si, sub in enumerate(it.substeps, start=1):
                role = sub.get("role", f"agent_{si}")
                tmpl = sub.get("prompt") or it.loop_prompt_template or "{state}"
                guard = (it.language_guardrails + "\n\n") if it.language_guardrails else ""
                # Use safe string replacement to avoid JSON formatting conflicts
                loop_prompt = guard + tmpl
                loop_prompt = loop_prompt.replace("{loop}", str(i))
                loop_prompt = loop_prompt.replace("{state}", json.dumps(state, ensure_ascii=False))
                loop_prompt = loop_prompt.replace("{params}", json.dumps(params, ensure_ascii=False))
                loop_prompt = loop_prompt.replace("{role}", role)
                async with _semaphore:
                    if it.step_response_schema and sub.get("schema") is None and si == len(it.substeps):
                        r = await client.chat.completions.create(
                            model=settings.openai_model,
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": loop_prompt}
                            ],
                            response_format={"type":"json_schema","json_schema":{
                                "name":f"{recipe.id}_step","schema":it.step_response_schema,"strict":True}}
                        )
                    else:
                        schema = sub.get("schema")
                        if schema:
                            r = await client.chat.completions.create(
                                model=settings.openai_model,
                                messages=[
                                    {"role": "system", "content": system_prompt},
                                    {"role": "user", "content": loop_prompt}
                                ],
                                response_format={"type":"json_schema","json_schema":{
                                    "name":f"{recipe.id}_sub_{si}","schema":schema,"strict":True}}
                            )
                        else:
                            r = await client.chat.completions.create(
                                model=settings.openai_model,
                                messages=[
                                    {"role": "system", "content": system_prompt},
                                    {"role": "user", "content": loop_prompt}
                                ],
                                response_format={"type":"json_object"}
                            )
                step_json = r.choices[0].message.content
                step_obj = json.loads(step_json)
                entry["substeps"].append({"role": role, "output": step_obj})
                if isinstance(step_obj, dict) and "next_state" in step_obj and isinstance(step_obj["next_state"], dict):
                    state = step_obj["next_state"]
                else:
                    state = {**state, f"loop_{i}_sub_{si}": step_obj}
            history.append(entry)
        else:
            guard = (it.language_guardrails + "\n\n") if it.language_guardrails else ""
            loop_prompt = guard + (it.loop_prompt_template or "{state}")
            loop_prompt = loop_prompt.replace("{loop}", str(i))
            loop_prompt = loop_prompt.replace("{state}", json.dumps(state, ensure_ascii=False))
            loop_prompt = loop_prompt.replace("{params}", json.dumps(params, ensure_ascii=False))
            async with _semaphore:
                if it.step_response_schema:
                    r = await client.chat.completions.create(
                        model=settings.openai_model,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": loop_prompt}
                        ],
                        response_format={"type":"json_schema","json_schema":{
                            "name":f"{recipe.id}_step","schema":it.step_response_schema,"strict":True}}
                    )
                else:
                    r = await client.chat.completions.create(
                        model=settings.openai_model,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": loop_prompt}
                        ],
                        response_format={"type":"json_object"}
                    )
            step = json.loads(r.choices[0].message.content)
            history.append(step)
            if isinstance(step, dict) and "next_state" in step and isinstance(step["next_state"], dict):
                state = step["next_state"]
            else:
                state = {**state, f"loop_{i}": step}

    # Check if recipe has final synthesis
    final_synthesis_result = None
    if (recipe.iterative and recipe.iterative.final_synthesis and 
        recipe.iterative.final_synthesis.get("enabled", False)):
        try:
            final_synthesis_result = await run_final_synthesis(recipe, params, history, state, system_prompt, client)
        except Exception as e:
            print(f"Error in final synthesis: {e}")

    result = {"recipe_id": recipe.id, "loops": count, "history": history, "final_state": state}
    
    if final_synthesis_result:
        result["final_synthesis"] = final_synthesis_result
    
    try:
        if recipe.ui_preferences and recipe.ui_preferences.get("render_as_markdown") and history:
            result["markdown"] = _render_markdown_from_history(history)
            # Add final synthesis to markdown if available
            if final_synthesis_result:
                result["markdown"] += _render_final_synthesis_markdown(final_synthesis_result)
    except Exception:
        pass
    return json.dumps(result, ensure_ascii=False)