import type { Recipe } from "./types";

export function listMockRecipes(): Recipe[] {
  return [{
    id: "multi_agent_debate",
    name: "Multi-Agent Debate",
    description: "Optimist vs Skeptic → Mediator, with Markdown transcript rendering.",
    inputs: ["problem", "loops=3"],
    user_prompt_template: "We will run {loops} loops on: {problem}",
    run_mode: "iterative",
    iterative: { default_loops: 3, max_loops: 10 },
    ui_preferences: { render_as_markdown: true }
  }];
}

export async function mockRun(body: any) {
  await new Promise(r => setTimeout(r, 350));
  const history = [
    { loop: 1, substeps: [
      { role: "Optimist", output: { proposals: [{ title: "Instant Onboarding", why: "Reduce delay to first value" }] } },
      { role: "Skeptic", output: { critiques: [{ target: "Instant Onboarding", risk: "Overwhelm risk for new hires", evidence: "Pilot 2024 Q3" }] } },
      { role: "Mediator", output: { synthesis: [{ direction: "Phased automation", trade_off: "Slower rollout but safer" }] } },
    ]},
    { loop: 2, substeps: [
      { role: "Optimist", output: { proposals: [{ title: "Buddy Autopair", why: "Increase engagement" }] } },
      { role: "Skeptic", output: { critiques: [{ target: "Buddy Autopair", risk: "Poor matching reduces trust" }] } },
      { role: "Mediator", output: { synthesis: [{ direction: "Opt-in matching with survey", trade_off: "More steps, better fit" }] } },
    ]},
  ];
  const markdown = `## 🧩 Loop 1
### 🟢 Optimist
**Proposal:** *Instant Onboarding*
> Reduce delay to first value
---
### 🔴 Skeptic
**Critique:** *Instant Onboarding*
> Overwhelm risk for new hires (evidence: Pilot 2024 Q3)
---
### ⚪ Mediator
**Synthesis:** *Phased automation*
> Trade-off: Slower rollout but safer
---`;
  return { recipe_id: body.recipe_id, mode: "iterative", output: { history, markdown }, meta: { model: "mock" } };
}