import json, asyncio, pathlib, json as _json
from typing import Dict, Any
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_openai import ChatOpenAI
from ..config import settings
from ..models import Recipe
from ..models_user import UserProfile

MAX_CONCURRENT_CALLS = 5
_semaphore = asyncio.Semaphore(MAX_CONCURRENT_CALLS)

def _template_from_text(text: str) -> PromptTemplate:
    return PromptTemplate.from_template(text)

def profile_to_preamble(profile: UserProfile) -> str:
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

async def run_one_shot(recipe: Recipe, params: Dict[str, Any]) -> str:
    async with _semaphore:
        llm = ChatOpenAI(model=settings.openai_model, temperature=0.5)
        preamble = ""
        profile = load_profile(params.get('user_id'))
        if profile: preamble = profile_to_preamble(profile) + "\n\n"
        tpl = _template_from_text(preamble + recipe.user_prompt_template)
        parser = JsonOutputParser()
        data = await (tpl | llm | parser).ainvoke(params)
        return json.dumps(data, ensure_ascii=False)

async def run_iterative_generic(recipe: Recipe, params: Dict[str, Any], loops: int | None) -> str:
    it = recipe.iterative
    if not it: raise ValueError("Recipe does not define an iterative configuration.")
    count = loops or it.default_loops
    if count > it.max_loops: raise ValueError(f"Requested loops ({count}) exceed max_loops ({it.max_loops}).")

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

    llm = ChatOpenAI(model=settings.openai_model, temperature=0.5)
    parser = JsonOutputParser()
    history = []

    for i in range(1, count + 1):
        entry = {"loop": i, "substeps": []}
        if it.substeps:
            for si, sub in enumerate(it.substeps, start=1):
                role = sub.get("role", f"agent_{si}")
                tmpl = sub.get("prompt") or it.loop_prompt_template or "{state}"
                guard = (it.language_guardrails + "\n\n") if it.language_guardrails else ""
                # Use safe string replacement to avoid JSON formatting conflicts
                prompt_text = guard + tmpl
                prompt_text = prompt_text.replace("{loop}", str(i))
                prompt_text = prompt_text.replace("{state}", json.dumps(state, ensure_ascii=False))
                prompt_text = prompt_text.replace("{params}", json.dumps(params, ensure_ascii=False))
                prompt_text = prompt_text.replace("{role}", role)
                data = await (_template_from_text(prompt_text) | llm | parser).ainvoke(params)
                entry["substeps"].append({"role": role, "output": data})
                if isinstance(data, dict) and "next_state" in data and isinstance(data["next_state"], dict):
                    state = data["next_state"]
                else:
                    state = {**state, f"loop_{i}_sub_{si}": data}
            history.append(entry)
        else:
            prompt_text = (it.loop_prompt_template or "{state}")
            prompt_text = prompt_text.replace("{loop}", str(i))
            prompt_text = prompt_text.replace("{state}", json.dumps(state, ensure_ascii=False))
            prompt_text = prompt_text.replace("{params}", json.dumps(params, ensure_ascii=False))
            data = await (_template_from_text(prompt_text) | llm | parser).ainvoke(params)
            history.append(data)
            if isinstance(data, dict) and "next_state" in data and isinstance(data["next_state"], dict):
                state = data["next_state"]
            else:
                state = {**state, f"loop_{i}": data}

    result = {"recipe_id": recipe.id, "loops": count, "history": history, "final_state": state}
    try:
        if recipe.ui_preferences and recipe.ui_preferences.get("render_as_markdown") and history:
            result["markdown"] = _render_markdown_from_history(history)
    except Exception:
        pass
    return json.dumps(result, ensure_ascii=False)