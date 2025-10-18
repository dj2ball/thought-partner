Complete Recipe Collection for Modular Ideation System
Core Design Principles
1. Composable Runner Functions
typescript// Core runners that execute different patterns
interface Runner {
  single_shot: (recipe: Recipe, inputs: Inputs) => Promise<Result>
  prompt_chain: (recipe: Recipe, inputs: Inputs) => Promise<Result>
  parallel: (recipe: Recipe, inputs: Inputs) => Promise<Result>
  iterative_loop: (recipe: Recipe, inputs: Inputs) => Promise<Result>
  orchestrator: (recipe: Recipe, inputs: Inputs) => Promise<Result>
  routing: (recipe: Recipe, inputs: Inputs) => Promise<Result>
}
2. Pattern Primitives (Building Blocks)

Generators: Create content
Evaluators: Assess quality
Routers: Classify and direct
Aggregators: Synthesize results
State Managers: Track iteration context

3. Recipe Schema
typescriptinterface Recipe {
  id: string
  name: string
  pattern: PatternType
  description: string
  meta: RecipeMeta
  inputs: InputDefinition[]
  workflow: WorkflowConfig
  output_format?: OutputSchema
}

Complete Recipe Collection
Recipe 1: Mind Mapping (Parallel Branching)
json{
  "id": "mind_mapping",
  "name": "Concept Mind Map",
  "pattern": "parallelization_sectioning",
  "description": "Radiate ideas from central concept across dimensions",
  "meta": {
    "best_for": ["exploring multi-faceted concepts", "strategic planning", "campaign planning"],
    "time_estimate": "5-10 minutes",
    "complexity": "beginner",
    "output_format": "mermaid_diagram",
    "works_well_with": ["affinity_mapping", "starbursting"]
  },
  "inputs": [
    {
      "name": "central_concept",
      "prompt": "What's your central concept?",
      "type": "text",
      "required": true,
      "examples": ["eco-friendly packaging", "remote team culture", "Q3 OKRs", "new CRM system"]
    },
    {
      "name": "dimensions",
      "prompt": "What aspects should branches explore? (4-6 recommended)",
      "type": "array",
      "required": false,
      "default": ["stakeholders", "opportunities", "constraints", "next steps"],
      "examples_by_context": {
        "product_launch": ["target users", "value props", "channels", "messaging", "risks"],
        "strategy": ["objectives", "resources", "timeline", "stakeholders", "metrics"],
        "creative": ["visual style", "tone", "formats", "platforms", "calls-to-action"]
      }
    },
    {
      "name": "depth",
      "prompt": "How many ideas per branch?",
      "type": "integer",
      "default": 6,
      "range": [3, 10]
    }
  ],
  "workflow": {
    "type": "parallel",
    "parallel": {
      "branch_template": {
        "role": "Branch Explorer: {dimension}",
        "system_prompt": "You are exploring one dimension of a concept. Be specific and actionable. Avoid generic platitudes.",
        "user_prompt": "Explore the '{dimension}' aspect of '{central_concept}'.\n\nGenerate {depth} specific ideas, considerations, or questions for this branch.\n\nFormat as a simple list."
      },
      "iteration_var": "dimensions",
      "aggregator": {
        "role": "Mind Map Synthesizer",
        "prompt": "Synthesize all branches into a hierarchical Mermaid mindmap diagram.\n\nCentral concept: {central_concept}\nBranches:\n{branch_results}\n\nGenerate valid Mermaid syntax:\n```mermaid\nmindmap\n  root(({central_concept}))\n    {dimension_1}\n      idea 1\n      idea 2\n    {dimension_2}\n      ...\n```\n\nInclude ALL branches and their key ideas."
      }
    }
  }
}

Recipe 2: Crazy 8s (Rapid Voting)
json{
  "id": "crazy_8s",
  "name": "Rapid Concept Generator (Crazy 8s)",
  "pattern": "parallelization_voting",
  "description": "Generate 8 diverse variations rapidly",
  "meta": {
    "best_for": ["breaking creative blocks", "ideation kickoff", "quick exploration"],
    "time_estimate": "3-8 minutes",
    "complexity": "beginner",
    "output_format": "ranked_list",
    "works_well_with": ["evaluator_optimizer", "affinity_mapping"]
  },
  "inputs": [
    {
      "name": "concept_type",
      "prompt": "What type of concept are you generating?",
      "type": "text",
      "required": true,
      "examples": ["app screen", "tagline", "product feature", "meeting agenda", "campaign idea", "architecture diagram"]
    },
    {
      "name": "context",
      "prompt": "Provide any relevant context or background",
      "type": "text",
      "required": true,
      "placeholder": "e.g., 'B2B SaaS product for sales teams, focusing on pipeline visibility'"
    },
    {
      "name": "constraints",
      "prompt": "Any constraints or requirements?",
      "type": "text",
      "required": false,
      "examples": ["must include logo", "B2B focus", "under $10k budget", "accessible to beginners"]
    },
    {
      "name": "diversity_axes",
      "prompt": "How should concepts differ?",
      "type": "array",
      "default": ["style", "audience", "complexity"],
      "examples": ["tone", "medium", "target user", "cost", "timeline", "technology"]
    }
  ],
  "workflow": {
    "type": "parallel",
    "parallel": {
      "voting": {
        "n_variations": 8,
        "variation_template": {
          "role": "Concept Generator",
          "system_prompt": "Generate ONE unique concept. Be concise and specific. Avoid hedging language. Each concept must be distinctly different.",
          "user_prompt": "Generate ONE {concept_type} concept.\n\nVariation: {i}/8\nContext: {context}\nConstraints: {constraints}\n\nThis variation must be unique in: {diversity_axes}\n\nProvide:\n- Concept title (5 words max)\n- Description (2-3 sentences)\n- Key differentiator (1 sentence)\n\nBe concise and specific."
        },
        "diversity_injection": {
          "method": "temperature_variance",
          "temperature_range": [0.7, 1.2]
        }
      },
      "aggregator": {
        "role": "Concept Ranker",
        "prompt": "Review these 8 concepts for '{concept_type}':\n\n{variations}\n\nRank all 8 by:\n1. **Novelty** (1-10): How different is this from typical solutions?\n2. **Feasibility** (1-10): Can this actually be implemented?\n3. **Impact** (1-10): Will this move the needle?\n\nProvide:\n- Ranking table with scores\n- Top 3 concepts with detailed reasoning\n- 1-2 sentence synthesis of what makes these stand out\n\nFormat as markdown."
      }
    }
  }
}

Recipe 3: Random Word Association
json{
  "id": "random_word",
  "name": "Random Word Catalyst",
  "pattern": "prompt_chaining",
  "description": "Use random stimulus to spark unexpected ideas",
  "meta": {
    "best_for": ["breaking mental ruts", "lateral thinking", "creative campaigns"],
    "time_estimate": "5-10 minutes",
    "complexity": "beginner",
    "output_format": "developed_concepts",
    "works_well_with": ["synectics", "provocation_po"]
  },
  "inputs": [
    {
      "name": "target_domain",
      "prompt": "What are you trying to generate ideas for?",
      "type": "text",
      "required": true,
      "examples": ["snack brand names", "workshop activities", "app features", "blog topics"]
    },
    {
      "name": "random_word",
      "prompt": "Random word (or we'll generate one)",
      "type": "text",
      "required": false,
      "generator": "random_noun",
      "examples": ["compass", "glacier", "kaleidoscope", "lighthouse"]
    },
    {
      "name": "n_connections",
      "prompt": "How many initial connections to explore?",
      "type": "integer",
      "default": 10,
      "range": [8, 15]
    }
  ],
  "workflow": {
    "type": "chain",
    "steps": [
      {
        "id": "analyze_word",
        "role": "Word Analyst",
        "system_prompt": "Analyze words deeply, going beyond surface meanings. Find hidden properties, metaphors, and associations.",
        "user_prompt": "Analyze the word '{random_word}' deeply:\n\n- Physical properties\n- Functional properties\n- Metaphorical associations\n- Cultural/emotional connotations\n- Related concepts\n\nGenerate {n_connections} distinct properties/associations. Be specific and varied."
      },
      {
        "id": "find_connections",
        "role": "Connection Finder",
        "system_prompt": "Force unexpected connections. Embrace absurdity initially - refinement comes later.",
        "user_prompt": "Link each property/association of '{random_word}' to '{target_domain}'.\n\nWord properties:\n{step.analyze_word.output}\n\nFor each property, force a connection to {target_domain}. Don't filter for practicality yet - just make surprising links.\n\nFormat:\n- [Property] → [Connection to {target_domain}] → [Rough idea]"
      },
      {
        "id": "develop_concepts",
        "role": "Concept Developer",
        "system_prompt": "Transform rough connections into viable concepts. Maintain the surprise factor while adding feasibility.",
        "user_prompt": "From these connections:\n{step.find_connections.output}\n\nSelect the 3 strongest connections and develop each into a full concept for {target_domain}.\n\nFor each:\n- Concept name/title\n- How it borrows from '{random_word}'\n- Why it's compelling\n- Implementation sketch (2-3 sentences)\n- Potential challenges"
      }
    ]
  }
}

Recipe 4: Lotus Blossom (Recursive Expansion)
json{
  "id": "lotus_blossom",
  "name": "Lotus Blossom Expander",
  "pattern": "iterative_expansion",
  "description": "Expand central theme into radiating layers of ideas",
  "meta": {
    "best_for": ["deep exploration", "comprehensive planning", "theme development"],
    "time_estimate": "10-15 minutes",
    "complexity": "intermediate",
    "output_format": "hierarchical_grid",
    "works_well_with": ["mind_mapping", "affinity_mapping"]
  },
  "inputs": [
    {
      "name": "core_theme",
      "prompt": "What's your central theme?",
      "type": "text",
      "required": true,
      "examples": ["community fitness", "sustainable office", "customer retention", "innovation culture"]
    },
    {
      "name": "depth",
      "prompt": "How many layers? (1=8 themes, 2=8 themes + 64 sub-ideas)",
      "type": "integer",
      "default": 2,
      "range": [1, 2]
    }
  ],
  "workflow": {
    "type": "iterative",
    "max_loops": 2,
    "state_schema": {
      "core": "string",
      "level_1_themes": "array",
      "level_2_ideas": "object",
      "total_ideas": "integer"
    },
    "initial_state": {
      "core": "{core_theme}",
      "level_1_themes": [],
      "level_2_ideas": {},
      "total_ideas": 0
    },
    "steps": [
      {
        "id": "radiate_themes",
        "condition": "loop == 1",
        "role": "Theme Radiator",
        "system_prompt": "Generate 8 distinct themes that surround and support the core concept. Each should be a different facet.",
        "user_prompt": "Core theme: '{core_theme}'\n\nGenerate 8 distinct first-level themes that radiate from this core.\n\nEach theme should:\n- Be a distinct facet (not overlapping)\n- Support/relate to the core\n- Be expressed in 2-4 words\n\nReturn as JSON:\n{\"themes\": [\"theme1\", \"theme2\", ...]}"
      },
      {
        "id": "expand_petals",
        "condition": "loop == 2 AND depth == 2",
        "role": "Petal Expander",
        "system_prompt": "For each theme, generate 8 specific, actionable sub-ideas. Maintain variety within each theme.",
        "user_prompt": "Expand each of these themes with 8 sub-ideas:\n\nThemes: {state.level_1_themes}\n\nFor each theme, generate 8 specific ideas/actions/considerations.\n\nReturn as JSON:\n{\n  \"theme_name\": [\"idea1\", \"idea2\", ...],\n  ...\n}\n\nTotal expected: 64 ideas (8 themes × 8 ideas each)"
      }
    ],
    "state_update": {
      "level_1_themes": "{step.radiate_themes.output.themes}",
      "level_2_ideas": "{step.expand_petals.output}",
      "total_ideas": "{count(level_2_ideas)}"
    },
    "final_synthesis": {
      "role": "Lotus Diagram Builder",
      "prompt": "Create an ASCII art Lotus Blossom diagram:\n\nCore: {state.core}\nThemes: {state.level_1_themes}\nSub-ideas: {state.level_2_ideas}\n\nFormat as a visual grid:\n```\n                [Theme 1]\n        [idea] [idea] [idea] [idea]\n        [idea] [idea] [idea] [idea]\n\n[Theme 8] [Theme 7]  [CORE]  [Theme 2] [Theme 3]\n\n        [Theme 6] [Theme 5] [Theme 4]\n```\n\nOr provide a clear hierarchical markdown structure."
    }
  }
}

Recipe 5: Brainwriting 6-3-5 (Simulated Rotation)
json{
  "id": "brainwriting_635",
  "name": "Brainwriting 6-3-5 Simulator",
  "pattern": "iterative_buildup",
  "description": "Simulate collaborative idea building with rotation",
  "meta": {
    "best_for": ["team ideation simulation", "building on ideas", "generating volume"],
    "time_estimate": "10-15 minutes",
    "complexity": "intermediate",
    "output_format": "evolution_table",
    "works_well_with": ["affinity_mapping", "lightning_decision_jam"]
  },
  "inputs": [
    {
      "name": "challenge",
      "prompt": "What challenge are you addressing?",
      "type": "text",
      "required": true,
      "examples": ["improve customer onboarding", "reduce meeting overhead", "increase engagement"]
    },
    {
      "name": "n_rounds",
      "prompt": "How many rounds?",
      "type": "integer",
      "default": 5,
      "range": [3, 6]
    },
    {
      "name": "n_participants",
      "prompt": "Simulated participants",
      "type": "integer",
      "default": 6,
      "range": [4, 6]
    }
  ],
  "workflow": {
    "type": "iterative",
    "max_loops": "{n_rounds}",
    "state_schema": {
      "sheets": "array[array]",
      "themes": "object",
      "round": "integer"
    },
    "initial_state": {
      "sheets": "Array({n_participants}).fill([])",
      "themes": {},
      "round": 0
    },
    "steps": [
      {
        "id": "contribute_ideas",
        "role": "Participant {participant_id}",
        "iteration": "for each participant in 1..{n_participants}",
        "system_prompt": "You are participant {participant_id} in round {loop}. Build on existing ideas - don't repeat them. Add fresh perspective.",
        "user_prompt": "Challenge: {challenge}\n\nRound: {loop}/{n_rounds}\nYou are participant {participant_id}\n\nCurrent sheet (from previous participant):\n{state.sheets[participant_id - 1 if loop > 1 else participant_id]}\n\nAdd 3 NEW ideas that:\n- Build on or are inspired by existing ideas (if any)\n- Don't repeat what's already there\n- Are specific and actionable\n\nReturn as JSON:\n{\"ideas\": [\"idea1\", \"idea2\", \"idea3\"]}"
      }
    ],
    "state_update": {
      "sheets": "rotate_and_append_ideas(state.sheets, step.contribute_ideas.output)",
      "round": "{loop}"
    },
    "rotation_logic": {
      "description": "After each round, rotate sheets: participant N gets sheet from participant N-1",
      "implementation": "sheets[(i + 1) % n_participants] = sheets[i] + new_ideas"
    },
    "final_synthesis": {
      "role": "Theme Analyzer",
      "prompt": "Analyze {n_rounds} rounds of brainwriting:\n\nAll sheets:\n{state.sheets}\n\nIdentify:\n1. Recurring themes (ideas that appeared multiple times or were built upon)\n2. Evolution patterns (how ideas developed across rounds)\n3. Top 5 refined ideas (strongest after iteration)\n\nFormat as:\n\n## Recurring Themes\n[theme]: appeared in rounds [X, Y, Z]\n\n## Evolution Examples\nRound 1: [initial idea]\n→ Round 3: [built upon version]\n→ Round 5: [final form]\n\n## Top 5 Refined Ideas\n1. [idea] - [why it's strong]"
    }
  }
}

Recipe 6: Storyboarding (Evaluator-Optimizer)
json{
  "id": "storyboarding",
  "name": "Sequential Storyboard Builder",
  "pattern": "evaluator_optimizer",
  "description": "Map any process/journey/narrative as sequential stages with iterative refinement",
  "meta": {
    "best_for": ["user journeys", "process mapping", "pitch flows", "demo scripts"],
    "time_estimate": "10-20 minutes",
    "complexity": "intermediate",
    "output_format": "sequential_stages",
    "works_well_with": ["starbursting", "reverse_brainstorming"]
  },
  "inputs": [
    {
      "name": "subject",
      "prompt": "What are you storyboarding?",
      "type": "text",
      "required": true,
      "examples": ["customer onboarding flow", "investor pitch", "product demo", "employee day-in-life", "sales call"]
    },
    {
      "name": "n_stages",
      "prompt": "How many stages?",
      "type": "integer",
      "default": 6,
      "range": [4, 12]
    },
    {
      "name": "stage_elements",
      "prompt": "What should each stage capture?",
      "type": "array",
      "default": ["visual description", "key action", "outcome"],
      "suggestions": ["visual", "dialogue", "decision point", "metric", "risk", "resource needed", "emotion", "system state"]
    }
  ],
  "workflow": {
    "type": "iterative",
    "max_loops": 3,
    "exit_condition": "avg_score >= 4.0 OR loops >= 3",
    "state_schema": {
      "storyboard": "array",
      "ratings": "array",
      "avg_score": "float",
      "revision_history": "array"
    },
    "steps": [
      {
        "id": "generate_storyboard",
        "role": "Storyboard Generator",
        "system_prompt": "Create logical, complete sequential stages. Ensure smooth transitions. Be specific about each element.",
        "user_prompt": "Create a {n_stages}-stage storyboard for: {subject}\n\nEach stage must include:\n{stage_elements}\n\nFormat:\n**Stage N: [Title]**\n- [Element 1]: ...\n- [Element 2]: ...\n- [Element 3]: ...\n\nEnsure:\n- Logical flow between stages\n- Clear transitions\n- Complete coverage of the journey\n\n{IF loop > 1: Apply these revisions:\n{state.revision_instructions}}"
      },
      {
        "id": "evaluate_continuity",
        "role": "Continuity Evaluator",
        "system_prompt": "Assess objectively. Identify specific issues. Don't inflate scores.",
        "user_prompt": "Review this {n_stages}-stage storyboard:\n\n{step.generate_storyboard.output}\n\nRate each stage (1-5) on:\n1. **Flow**: Logical connection to previous/next stage?\n2. **Completeness**: All context provided?\n3. **Clarity**: Unambiguous and specific?\n\nReturn JSON:\n{\n  \"stage_ratings\": [\n    {\n      \"stage\": 1,\n      \"flow\": 4,\n      \"completeness\": 5,\n      \"clarity\": 4,\n      \"issues\": \"transition from stage 0 could be smoother\"\n    },\n    ...\n  ],\n  \"avg_score\": 4.2,\n  \"overall_issues\": [\"list of cross-cutting issues\"]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "stage_ratings": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "stage": {"type": "integer"},
                  "flow": {"type": "integer", "minimum": 1, "maximum": 5},
                  "completeness": {"type": "integer", "minimum": 1, "maximum": 5},
                  "clarity": {"type": "integer", "minimum": 1, "maximum": 5},
                  "issues": {"type": "string"}
                },
                "required": ["stage", "flow", "completeness", "clarity", "issues"]
              }
            },
            "avg_score": {"type": "number"},
            "overall_issues": {"type": "array", "items": {"type": "string"}}
          },
          "required": ["stage_ratings", "avg_score", "overall_issues"]
        }
      },
      {
        "id": "decide_revision",
        "role": "Revision Decider",
        "system_prompt": "Only request revision if truly needed. Provide specific, actionable instructions.",
        "user_prompt": "Evaluation results:\n{step.evaluate_continuity.output}\n\nAverage score: {step.evaluate_continuity.output.avg_score}\n\nIF avg_score < 4.0:\n  Provide specific revision instructions focusing on lowest-rated stages and identified issues.\nELSE:\n  Approve the storyboard.\n\nReturn JSON:\n{\n  \"accepted\": boolean,\n  \"revision_instructions\": string | null\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "accepted": {"type": "boolean"},
            "revision_instructions": {"type": ["string", "null"]}
          },
          "required": ["accepted"]
        }
      }
    ],
    "state_update": {
      "storyboard": "{step.generate_storyboard.output}",
      "ratings": "{step.evaluate_continuity.output.stage_ratings}",
      "avg_score": "{step.evaluate_continuity.output.avg_score}",
      "revision_instructions": "{step.decide_revision.output.revision_instructions}",
      "revision_history": "append({loop: loop, score: avg_score})"
    }
  }
}

Recipe 7: Affinity Mapping (Routing + Classification)
json{
  "id": "affinity_mapping",
  "name": "Affinity Clustering",
  "pattern": "routing_classification",
  "description": "Cluster unstructured ideas into coherent themes",
  "meta": {
    "best_for": ["post-brainstorm synthesis", "organizing research", "finding patterns"],
    "time_estimate": "5-10 minutes",
    "complexity": "beginner",
    "output_format": "hierarchical_clusters",
    "works_well_with": ["brainwriting_635", "crazy_8s", "world_cafe"]
  },
  "inputs": [
    {
      "name": "raw_ideas",
      "prompt": "Paste your raw ideas/notes (one per line or comma-separated)",
      "type": "text",
      "required": true,
      "multiline": true,
      "placeholder": "idea 1\nidea 2\nidea 3..."
    },
    {
      "name": "context",
      "prompt": "What were these ideas for? (helps with clustering)",
      "type": "text",
      "required": false,
      "examples": ["sustainable packaging brainstorm", "Q4 campaign concepts", "customer pain points"]
    },
    {
      "name": "target_clusters",
      "prompt": "Desired number of clusters (or 'auto')",
      "type": "string",
      "default": "auto",
      "range": [3, 8]
    }
  ],
  "workflow": {
    "type": "routing",
    "router": {
      "role": "Cluster Identifier",
      "system_prompt": "Identify natural groupings. Let the data speak - don't force predetermined categories.",
      "user_prompt": "Analyze these ideas from: {context}\n\n{raw_ideas}\n\nIdentify {target_clusters} natural clusters.\n\nFor each cluster:\n- Name (2-4 words)\n- Theme description (1 sentence)\n- List of idea IDs that belong (use line numbers)\n\nReturn JSON:\n{\n  \"clusters\": [\n    {\n      \"name\": \"cluster name\",\n      \"theme\": \"description\",\n      \"idea_ids\": [1, 5, 12],\n      \"count\": 3\n    },\n    ...\n  ],\n  \"outliers\": [idea_ids that don't fit well]\n}",
      "output_schema": {
        "type": "object",
        "properties": {
          "clusters": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {"type": "string"},
                "theme": {"type": "string"},
                "idea_ids": {"type": "array", "items": {"type": "integer"}},
                "count": {"type": "integer"}
              },
              "required": ["name", "theme", "idea_ids", "count"]
            }
          },
          "outliers": {"type": "array", "items": {"type": "integer"}}
        },
        "required": ["clusters"]
      }
    },
    "workers": [
      {
        "id": "refine_cluster",
        "role": "Cluster Refiner",
        "iteration": "for each cluster",
        "system_prompt": "Consolidate similar ideas and identify sub-themes. Look for actionable insights.",
        "user_prompt": "Cluster: '{cluster.name}'\nTheme: {cluster.theme}\n\nIdeas in this cluster:\n{ideas_from_cluster}\n\nTasks:\n1. Consolidate similar/duplicate ideas\n2. Identify 2-3 sub-themes within the cluster\n3. Highlight the most actionable/novel idea\n\nReturn markdown:\n### {cluster.name} (n={count})\n**Theme**: {theme}\n\n**Sub-themes**:\n- Sub-theme 1\n- Sub-theme 2\n\n**Top idea**: [most actionable idea]\n\n**Consolidated ideas**:\n- idea\n- idea"
      }
    ],
    "final_synthesis": {
      "role": "Affinity Map Builder",
      "prompt": "Create final affinity map:\n\nClusters:\n{worker_outputs}\n\nOutliers:\n{router.outliers}\n\nProvide:\n1. Summary table (Cluster | Count | Key Theme)\n2. Refined cluster descriptions\n3. Cross-cluster insights (patterns across clusters)\n4. Recommendation for next steps\n\nFormat as clean markdown."
    }
  }
}

Recipe 8: Starbursting (Orchestrator-Workers)
json{
  "id": "starbursting",
  "name": "Multi-Angle Question Explorer",
  "pattern": "orchestrator_workers",
  "description": "Explore topic from multiple interrogative angles to surface gaps",
  "meta": {
    "best_for": ["pre-launch checklist", "risk discovery", "comprehensive analysis"],
    "time_estimate": "10-15 minutes",
    "complexity": "intermediate",
    "output_format": "prioritized_questions",
    "works_well_with": ["lightning_decision_jam", "futuring_backwards"]
  },
  "inputs": [
    {
      "name": "topic",
      "prompt": "What topic are you exploring?",
      "type": "text",
      "required": true,
      "examples": ["new pricing model", "competitor entry strategy", "technical architecture choice", "team reorganization"]
    },
    {
      "name": "question_frameworks",
      "prompt": "Which question angles to explore?",
      "type": "array",
      "default": ["Who", "What", "When", "Where", "Why", "How"],
      "customizable": true,
      "alternatives": ["Costs", "Benefits", "Risks", "Alternatives", "Dependencies", "Metrics"]
    },
    {
      "name": "exploration_focus",
      "prompt": "What are you trying to uncover?",
      "type": "text",
      "required": false,
      "examples": ["hidden risks", "key assumptions", "stakeholder needs", "implementation gaps"],
      "default": "gaps and risks"
    }
  ],
  "workflow": {
    "type": "orchestrator",
    "orchestrator": {
      "planner": {
        "role": "Question Strategy Planner",
        "system_prompt": "Prioritize dimensions that will reveal the most critical unknowns. Consider the exploration focus.",
        "user_prompt": "Topic: {topic}\nExploration focus: {exploration_focus}\n\nAvailable question frameworks: {question_frameworks}\n\nSelect the 5 most valuable dimensions to explore based on the focus.\n\nReturn JSON:\n{\n  \"selected_dimensions\": [\"dim1\", \"dim2\", ...],\n  \"rationale\": \"why these 5 will reveal the most\"\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "selected_dimensions": {"type": "array", "items": {"type": "string"}, "minItems": 5, "maxItems": 5},
            "rationale": {"type": "string"}
          },
          "required": ["selected_dimensions", "rationale"]
        }
      },
      "workers": {
        "role": "{dimension} Explorer",
        "iteration": "for each selected_dimension",
        "system_prompt": "Generate probing questions that reveal blind spots. Go beyond obvious questions. Focus on {exploration_focus}.",
        "user_prompt": "Dimension: {dimension}\nTopic: {topic}\nFocus: {exploration_focus}\n\nGenerate 5 probing '{dimension}' questions about {topic}.\n\nQuestions should:\n- Reveal gaps, risks, or opportunities\n- Not be answerable with simple yes/no\n- Challenge assumptions\n- Be specific to this topic\n\nReturn JSON:\n{\n  \"questions\": [\n    {\"question\": \"...\", \"why_important\": \"...\"},\n    ...\n  ]\n}"
      },
      "synthesizer": {
        "role": "Question Prioritizer",
        "system_prompt": "Rank ruthlessly. Focus on questions that could change decisions or reveal critical unknowns.",
        "user_prompt": "All questions across dimensions:\n{worker_outputs}\n\nRank ALL questions by:\n1. **Insight potential** (1-10): Will answering this change our approach?\n2. **Risk exposure** (1-10): Does this reveal a blind spot?\n3. **Actionability** (1-10): Can we answer this soon?\n\nProvide:\n- Top 5 questions with scores and reasoning\n- Suggested next steps for answering each\n- Any critical gaps still not covered\n\nFormat as markdown table:\n| Rank | Question | Insight | Risk | Action | Why Critical | Next Step |"
      }
    }
  }
}

Recipe 9: Morphological Matrix (Orchestrator + Combinatorial)
json{
  "id": "morphological_matrix",
  "name": "Morphological Analysis",
  "pattern": "orchestrator_combinatorial",
  "description": "Systematically combine attributes to discover novel configurations",
  "meta": {
    "best_for": ["product design", "feature exploration", "configuration testing"],
    "time_estimate": "15-20 minutes",
    "complexity": "advanced",
    "output_format": "evaluated_combinations",
    "works_well_with": ["crazy_8s", "synectics"]
  },
  "inputs": [
    {
      "name": "product_concept",
      "prompt": "What product/system are you designing?",
      "type": "text",
      "required": true,
      "examples": ["smart kettle", "project management tool", "office chair", "mobile game"]
    },
    {
      "name": "n_attributes",
      "prompt": "How many attributes to vary?",
      "type": "integer",
      "default": 4,
      "range": [3, 5]
    },
    {
      "name": "options_per_attribute",
      "prompt": "Options per attribute?",
      "type": "integer",
      "default": 4,
      "range": [3, 5]
    }
  ],
  "workflow": {
    "type": "orchestrator",
    "orchestrator": {
      "planner": {
        "role": "Matrix Architect",
        "system_prompt": "Identify attributes that are truly independent and combinable. Choose attributes where variation creates meaningful differences.",
        "user_prompt": "Product: {product_concept}\n\nIdentify {n_attributes} critical attributes to vary.\n\nFor each attribute, generate {options_per_attribute} diverse options.\n\nReturn JSON:\n{\n  \"attributes\": [\n    {\n      \"name\": \"attribute name\",\n      \"options\": [\"opt1\", \"opt2\", \"opt3\", \"opt4\"]\n    },\n    ...\n  ]\n}\n\nExample for smart kettle:\n{\n  \"attributes\": [\n    {\"name\": \"Heat Source\", \"options\": [\"electric coil\", \"induction\", \"solar\", \"chemical\"]},\n    {\"name\": \"Sensors\", \"options\": [\"temperature only\", \"temp + volume\", \"temp + composition\", \"none\"]},\n    {\"name\": \"Material\", \"options\": [\"stainless steel\", \"glass\", \"ceramic\", \"titanium\"]},\n    {\"name\": \"Power\", \"options\": [\"plug-in\", \"battery\", \"USB-C\", \"kinetic\"]}  \n  ]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "attributes": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": {"type": "string"},
                  "options": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["name", "options"]
              }
            }
          },
          "required": ["attributes"]
        }
      },
      "sampler": {
        "role": "Combination Sampler",
        "system_prompt": "Sample combinations using: novelty (unusual pairings), feasibility filter (not impossible), diversity maximization (spread across option space).",
        "user_prompt": "Matrix:\n{planner.output}\n\nTotal possible combinations: {calculate_combinations}\n\nSelect 12 promising combinations using:\n1. Novelty score (unusual but not absurd)\n2. Feasibility filter (eliminate impossible combos)\n3. Diversity (spread across option space)\n\nReturn JSON:\n{\n  \"selected_combinations\": [\n    {\n      \"id\": 1,\n      \"combination\": {\"Heat Source\": \"solar\", \"Sensors\": \"temp + composition\", ...},\n      \"selection_reason\": \"why sampled\"\n    },\n    ...\n  ]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "selected_combinations": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {"type": "integer"},
                  "combination": {"type": "object"},
                  "selection_reason": {"type": "string"}
                },
                "required": ["id", "combination", "selection_reason"]
              },
              "minItems": 12,
              "maxItems": 12
            }
          }
        }
      },
      "workers": {
        "role": "Combination Evaluator",
        "iteration": "for each selected_combination",
        "system_prompt": "Evaluate honestly. Identify both synergies and conflicts. Innovation score should reflect genuine novelty.",
        "user_prompt": "Evaluate this combination for {product_concept}:\n\n{combination}\n\nAssess:\n1. **Synergies**: What works well together?\n2. **Conflicts**: What creates problems?\n3. **Innovation score** (1-10): How novel is this?\n4. **Feasibility** (1-10): How buildable?\n5. **Market potential** (1-10): Would people want this?\n\nReturn JSON:\n{\n  \"combination_id\": {id},\n  \"synergies\": [\"list\"],\n  \"conflicts\": [\"list\"],\n  \"innovation_score\": int,\n  \"feasibility_score\": int,\n  \"market_score\": int,\n  \"overall_assessment\": \"brief summary\"\n}"
      },
      "synthesizer": {
        "role": "Concept Developer",
        "system_prompt": "Transform top combinations into compelling concept pitches. Include honest trade-off analysis.",
        "user_prompt": "All evaluated combinations:\n{worker_outputs}\n\nSelect top 3 by weighted score:\n- Innovation: 0.4\n- Feasibility: 0.3\n- Market: 0.3\n\nFor each top combo, develop into a full concept pitch:\n\n**Concept Name**: [catchy name]\n**Configuration**: [attribute values]\n**Value Proposition**: [what makes this special]\n**Key Synergies**: [what works]\n**Trade-offs**: [honest challenges]\n**Target User**: [who wants this]\n**Next Steps**: [how to prototype]\n\nFormat as markdown."
      }
    }
  }
}

Recipe 10: Lightning Decision Jam (Reverse + Vote + Action)
json{
  "id": "lightning_decision_jam",
  "name": "Lightning Decision Jam",
  "pattern": "reverse_brainstorming_voting",
  "description": "Fast problem-solving: obstacles → solutions → prioritized actions",
  "meta": {
    "best_for": ["breaking logjams", "actionable outcomes", "meeting facilitation"],
    "time_estimate": "8-12 minutes",
    "complexity": "intermediate",
    "output_format": "action_plan",
    "works_well_with": ["starbursting", "affinity_mapping"]
  },
  "inputs": [
    {
      "name": "problem",
      "prompt": "What problem needs solving?",
      "type": "text",
      "required": true,
      "examples": ["low newsletter open rates", "slow deployment pipeline", "unclear product roadmap", "siloed team communication"]
    },
    {
      "name": "deadline",
      "prompt": "When do you need progress by?",
      "type": "text",
      "required": false,
      "examples": ["end of month", "next sprint", "Q4", "ASAP"]
    }
  ],
  "workflow": {
    "type": "chain",
    "steps": [
      {
        "id": "identify_obstacles",
        "role": "Obstacle Identifier",
        "system_prompt": "Be specific. Avoid generic obstacles like 'lack of resources'. Dig into what's truly blocking progress.",
        "user_prompt": "Problem: {problem}\n\nList 8 specific obstacles preventing a solution.\n\nAvoid generic obstacles like:\n- 'lack of time'\n- 'insufficient budget'\n- 'need more people'\n\nInstead, be specific:\n- 'emails sent at 10am get buried in inbox rush'\n- 'no automated rollback mechanism'\n- 'roadmap decisions happening in ad-hoc conversations'\n\nReturn JSON:\n{\n  \"obstacles\": [\"specific obstacle 1\", \"obstacle 2\", ...]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "obstacles": {"type": "array", "items": {"type": "string"}, "minItems": 8, "maxItems": 8}
          },
          "required": ["obstacles"]
        }
      },
      {
        "id": "flip_to_solutions",
        "role": "Solution Flipper",
        "system_prompt": "Invert each obstacle into a concrete, actionable solution. Not just 'fix X' but 'do Y to address X'.",
        "user_prompt": "Obstacles:\n{step.identify_obstacles.output.obstacles}\n\nFor each obstacle, flip it into an actionable solution.\n\nFormat:\n**Obstacle**: [obstacle]\n**Solution**: [actionable flip]\n**Quick Win?**: [yes/no - can this be done in < 2 weeks?]\n\nExample:\nObstacle: emails sent at 10am get buried\nSolution: A/B test send times (6am, 12pm, 6pm) to find optimal window\nQuick Win?: yes\n\nReturn JSON:\n{\n  \"solutions\": [\n    {\n      \"obstacle\": \"...\",\n      \"solution\": \"...\",\n      \"quick_win\": boolean\n    },\n    ...\n  ]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "solutions": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "obstacle": {"type": "string"},
                  "solution": {"type": "string"},
                  "quick_win": {"type": "boolean"}
                },
                "required": ["obstacle", "solution", "quick_win"]
              }
            }
          }
        }
      },
      {
        "id": "vote_prioritize",
        "role": "Dot Voter",
        "system_prompt": "Vote based on weighted criteria. Be honest about feasibility - don't inflate scores.",
        "user_prompt": "Solutions:\n{step.flip_to_solutions.output.solutions}\n\nVote on each solution:\n- **Impact** (1-5): Will this meaningfully address the problem?\n- **Feasibility** (1-5): Can we actually do this?\n- **Speed** (1-5): How quickly can we implement?\n\nWeighting: Impact (0.5), Feasibility (0.3), Speed (0.2)\n\nReturn JSON:\n{\n  \"voted_solutions\": [\n    {\n      \"solution\": \"...\",\n      \"impact\": int,\n      \"feasibility\": int,\n      \"speed\": int,\n      \"weighted_score\": float\n    },\n    ...\n  ],\n  \"top_3\": [solutions sorted by weighted_score]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "voted_solutions": {"type": "array"},
            "top_3": {
              "type": "array",
              "items": {"type": "object"},
              "minItems": 3,
              "maxItems": 3
            }
          }
        }
      },
      {
        "id": "create_action_plan",
        "role": "Action Planner",
        "system_prompt": "Create concrete action plans. Assign realistic timelines. Identify owners (even if generic roles).",
        "user_prompt": "Top 3 solutions:\n{step.vote_prioritize.output.top_3}\n\nDeadline context: {deadline}\n\nFor each solution, create Monday stand-up format:\n\n**Solution**: [solution name]\n**Owner**: [role - e.g., 'Engineering Lead', 'Marketing Manager']\n**First 3 Steps**:\n  1. [concrete step with details]\n  2. [concrete step]\n  3. [concrete step]\n**Done-by Date**: [specific date based on deadline]\n**Success Metric**: [how we'll know it worked]\n\nFormat as clean markdown."
      }
    ]
  }
}

Recipe 11: Provocation (Po)
json{
  "id": "provocation_po",
  "name": "Provocation Technique (Po)",
  "pattern": "constrained_generation",
  "description": "Use absurd provocations to trigger lateral thinking",
  "meta": {
    "best_for": ["breaking assumptions", "radical innovation", "creative campaigns"],
    "time_estimate": "8-12 minutes",
    "complexity": "intermediate",
    "output_format": "grounded_innovations",
    "works_well_with": ["synectics", "random_word"]
  },
  "inputs": [
    {
      "name": "domain",
      "prompt": "What domain are you innovating in?",
      "type": "text",
      "required": true,
      "examples": ["restaurant experience", "enterprise software", "urban transportation", "education"]
    },
    {
      "name": "provocation",
      "prompt": "Absurd provocation (or we'll generate one)",
      "type": "text",
      "required": false,
      "generator": "provocation_generator",
      "examples": [
        "Magazines dissolve after reading",
        "Cars drive backwards only",
        "Meetings happen in complete silence",
        "Products age in reverse"
      ]
    }
  ],
  "workflow": {
    "type": "chain",
    "steps": [
      {
        "id": "generate_ideas",
        "role": "Provocateur",
        "system_prompt": "Embrace the absurd. Don't immediately jump to 'realistic'. Let the provocation pull you into weird territory first.",
        "constraints": {
          "min_ideas": 8,
          "banned_phrases": ["practical", "realistic", "feasible", "achievable"],
          "required": "Each idea must directly reference the provocation"
        },
        "user_prompt": "Provocation: '{provocation}'\nDomain: {domain}\n\nGenerate 8 business/product ideas triggered by this provocation.\n\nDon't filter for practicality yet. Each idea should:\n- Directly reference the provocation\n- Apply to {domain}\n- Be specific (not abstract)\n\nAvoid saying things like 'this would be practical if...' - just run with the provocation.\n\nReturn JSON:\n{\n  \"ideas\": [\n    {\"id\": 1, \"title\": \"...\", \"description\": \"2-3 sentences\"},\n    ...\n  ]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "ideas": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {"type": "integer"},
                  "title": {"type": "string"},
                  "description": {"type": "string"}
                },
                "required": ["id", "title", "description"]
              },
              "minItems": 8
            }
          }
        }
      },
      {
        "id": "reverse_engineer",
        "role": "Reverse Engineer",
        "system_prompt": "Extract the kernel of insight. What assumption does the idea challenge? How could it be grounded?",
        "user_prompt": "Ideas from provocation '{provocation}':\n{step.generate_ideas.output.ideas}\n\nFor each idea, extract:\n1. **Core insight**: What assumption is being challenged?\n2. **Viability** (1-10): Could some version of this work?\n3. **Wow factor** (1-10): How surprising/delightful is this?\n4. **Implementation sketch**: What would a realistic version look like?\n\nReturn JSON:\n{\n  \"analyzed_ideas\": [\n    {\n      \"id\": int,\n      \"title\": \"...\",\n      \"core_insight\": \"...\",\n      \"viability\": int,\n      \"wow_factor\": int,\n      \"implementation_sketch\": \"2-3 sentences\"\n    },\n    ...\n  ]\n}"
      },
      {
        "id": "select_and_develop",
        "role": "Concept Developer",
        "system_prompt": "Balance wow factor with viability. Maintain the surprising element while making it buildable.",
        "user_prompt": "Analyzed ideas:\n{step.reverse_engineer.output.analyzed_ideas}\n\nSelect top 3 by combined score (viability × wow_factor).\n\nFor each, develop:\n- **Concept name**\n- **The provocation insight**: What assumption we're breaking\n- **Grounded approach**: How to actually build this\n- **Why it works**: User benefit\n- **Example scenario**: What this looks like in practice\n\nFormat as markdown with clear sections."
      }
    ]
  }
}

Recipe 12: Synectics (Metaphor Forcing)
json{
  "id": "synectics",
  "name": "Synectics Metaphor Merger",
  "pattern": "analogy_forcing",
  "description": "Merge unrelated domains through structural metaphors",
  "meta": {
    "best_for": ["novel feature discovery", "reframing problems", "creative differentiation"],
    "time_estimate": "12-18 minutes",
    "complexity": "advanced",
    "output_format": "metaphor_derived_features",
    "works_well_with": ["morphological_matrix", "provocation_po"]
  },
  "inputs": [
    {
      "name": "target_domain",
      "prompt": "What are you trying to improve/innovate?",
      "type": "text",
      "required": true,
      "examples": ["project management tool", "sales process", "office layout", "reporting dashboard", "customer support"]
    },
    {
      "name": "source_domain",
      "prompt": "What unrelated domain to draw from?",
      "type": "text",
      "required": false,
      "generator": "diverse_domain_generator",
      "examples": ["jazz improvisation", "immune system", "city traffic flow", "restaurant kitchen", "coral reef", "jazz ensemble"],
      "helper_text": "Choose something TOTALLY unrelated - that's where the magic happens"
    }
  ],
  "workflow": {
    "type": "chain",
    "steps": [
      {
        "id": "map_structure",
        "role": "Metaphor Mapper",
        "system_prompt": "Go deep on structural patterns, not surface similarities. How does it WORK, not what does it LOOK like.",
        "user_prompt": "Analyze '{source_domain}' at a structural level:\n\n1. **Core mechanisms**: How does it actually work?\n2. **Success patterns**: What makes it effective?\n3. **Failure modes**: How does it break down?\n4. **Organizing principles**: What rules govern it?\n5. **Feedback loops**: How does it self-correct?\n6. **Emergence**: What emerges from interactions?\n\nGenerate 10 structural insights. Focus on FUNCTION, not form.\n\nExample (bad): 'Jazz bands have a drummer' (surface)\nExample (good): 'Jazz musicians signal transitions through non-verbal cues like eye contact and body language' (structural)\n\nReturn JSON:\n{\n  \"insights\": [\n    {\"id\": 1, \"insight\": \"structural observation\", \"category\": \"mechanism|success|failure|principle|feedback|emergence\"},\n    ...\n  ]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "insights": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {"type": "integer"},
                  "insight": {"type": "string"},
                  "category": {"type": "string", "enum": ["mechanism", "success", "failure", "principle", "feedback", "emergence"]}
                },
                "required": ["id", "insight", "category"]
              },
              "minItems": 10
            }
          }
        }
      },
      {
        "id": "build_bridges",
        "role": "Cross-Domain Translator",
        "system_prompt": "Force connections. Ask: 'If we applied THIS pattern to THAT domain, what emerges?' Be specific, not abstract.",
        "user_prompt": "Structural insights about '{source_domain}':\n{step.map_structure.output.insights}\n\nTarget domain: {target_domain}\n\nFor each insight, ask: 'If we applied this pattern to {target_domain}, what would emerge?'\n\nCreate 10 metaphor bridges. Be SPECIFIC.\n\nExample:\n- Source insight: 'Jazz musicians signal transitions with eye contact and body language'\n- Bridge: 'Project management tool could use real-time presence indicators (who's actively working on what) plus visual 'ready to hand-off' signals'\n\nReturn JSON:\n{\n  \"bridges\": [\n    {\n      \"source_insight_id\": int,\n      \"bridge\": \"specific connection\",\n      \"what_emerges\": \"concrete application to {target_domain}\"\n    },\n    ...\n  ]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "bridges": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "source_insight_id": {"type": "integer"},
                  "bridge": {"type": "string"},
                  "what_emerges": {"type": "string"}
                },
                "required": ["source_insight_id", "bridge", "what_emerges"]
              },
              "minItems": 10
            }
          }
        }
      },
      {
        "id": "extract_features",
        "role": "Feature Extractor",
        "system_prompt": "Transform bridges into concrete features. Maintain the metaphorical insight while making it buildable.",
        "user_prompt": "Metaphor bridges:\n{step.build_bridges.output.bridges}\n\nExtract 5 concrete features/approaches for {target_domain}.\n\nEach must include:\n- **Feature name**\n- **How it borrows from '{source_domain}'** (reference the original insight)\n- **User benefit** (what problem does this solve?)\n- **Implementation sketch** (2-3 sentences on how to build)\n\nReturn JSON:\n{\n  \"features\": [\n    {\n      \"name\": \"...\",\n      \"borrows_from\": \"specific source insight\",\n      \"user_benefit\": \"...\",\n      \"implementation\": \"...\"\n    },\n    ...\n  ]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "features": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": {"type": "string"},
                  "borrows_from": {"type": "string"},
                  "user_benefit": {"type": "string"},
                  "implementation": {"type": "string"}
                },
                "required": ["name", "borrows_from", "user_benefit", "implementation"]
              },
              "minItems": 5
            }
          }
        }
      },
      {
        "id": "develop_prototypes",
        "role": "Prototype Sketcher",
        "system_prompt": "Develop into prototype concepts. Include success metrics and novelty justification.",
        "user_prompt": "Features:\n{step.extract_features.output.features}\n\nDevelop top 3 (by novelty + feasibility) into prototype concepts.\n\nFor each:\n- **Prototype name**\n- **User story**: 'As a [user], I want [goal] so that [benefit]'\n- **Technical approach**: How to build (3-4 sentences)\n- **Success metrics**: How we'll measure if it works\n- **Why this is novel**: What makes this different from existing solutions (not just a reskin)\n\nFormat as markdown."
      }
    ]
  }
}

Recipe 13: Futuring Backwards (Temporal Reasoning)
json{
  "id": "futuring_backwards",
  "name": "Backcasting from Future Vision",
  "pattern": "temporal_reasoning",
  "description": "Work backward from future state to identify immediate actions",
  "meta": {
    "best_for": ["strategic planning", "long-term vision", "roadmap development"],
    "time_estimate": "12-18 minutes",
    "complexity": "intermediate",
    "output_format": "milestone_map",
    "works_well_with": ["starbursting", "lightning_decision_jam"]
  },
  "inputs": [
    {
      "name": "future_year",
      "prompt": "What year is your future vision?",
      "type": "integer",
      "default": 2030,
      "range": [2026, 2035]
    },
    {
      "name": "future_vision",
      "prompt": "Describe your achieved future state",
      "type": "text",
      "required": true,
      "multiline": true,
      "examples": [
        "We're the leading zero-carbon logistics provider in North America",
        "Our product is the default tool for remote team collaboration",
        "We've reduced customer churn to under 2% annually"
      ]
    },
    {
      "name": "current_state",
      "prompt": "Where are you today? (optional but helpful)",
      "type": "text",
      "required": false,
      "multiline": true
    }
  ],
  "workflow": {
    "type": "chain",
    "steps": [
      {
        "id": "elaborate_future",
        "role": "Future State Elaborator",
        "system_prompt": "Make the future tangible. What specific systems, behaviors, and metrics prove this future exists?",
        "user_prompt": "Future vision ({future_year}): {future_vision}\n\nElaborate on this future state:\n\n1. **Systems in place**: What infrastructure/processes exist?\n2. **Behavioral changes**: How do people/teams operate differently?\n3. **Key metrics**: What numbers prove we've achieved this?\n4. **Market position**: How are we perceived?\n5. **Capabilities**: What can we do that we can't do today?\n\nBe concrete and specific. Paint a vivid picture.\n\nReturn as detailed markdown."
      },
      {
        "id": "identify_milestones",
        "role": "Milestone Backtracker",
        "system_prompt": "Work backward chronologically. Each milestone must be verifiable and causally necessary for the next.",
        "user_prompt": "Future state ({future_year}):\n{step.elaborate_future.output}\n\nCurrent state:\n{current_state}\n\nWork backward from {future_year} to TODAY ({current_year}).\n\nIdentify 5 critical milestones needed to reach the future state.\n\nEach milestone must:\n- Have a specific year\n- Be verifiable (measurable outcome)\n- Enable the next milestone\n- Be realistic given prior milestones\n\nReturn JSON:\n{\n  \"milestones\": [\n    {\n      \"year\": int,\n      \"milestone\": \"specific achievement\",\n      \"verification\": \"how we'll know we achieved it\",\n      \"enables\": \"what this unlocks for the next stage\"\n    },\n    ...\n  ]\n}\n\nOrder from {future_year} backward to {current_year}.",
        "output_schema": {
          "type": "object",
          "properties": {
            "milestones": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "year": {"type": "integer"},
                  "milestone": {"type": "string"},
                  "verification": {"type": "string"},
                  "enables": {"type": "string"}
                },
                "required": ["year", "milestone", "verification", "enables"]
              },
              "minItems": 5,
              "maxItems": 5
            }
          }
        }
      },
      {
        "id": "focus_near_term",
        "role": "Near-Term Opportunity Highlighter",
        "system_prompt": "Translate long-term vision into immediate action. Be specific about next quarter.",
        "user_prompt": "Milestones:\n{step.identify_milestones.output.milestones}\n\nFocus on the NEXT QUARTER only.\n\nBased on the milestone path, identify:\n\n1. **3 brainstorm arenas**: Topics/areas that need ideation\n2. **2 quick experiments**: Small tests we can run in 4-8 weeks\n3. **1 strategic decision**: Critical choice that affects the path forward\n\nFor each, explain:\n- Why it matters for staying on the milestone path\n- What we'll learn\n- Estimated effort\n\nFormat as markdown:\n\n## Next Quarter Focus\n\n### Brainstorm Arenas\n1. **[Arena]**: [why] | [what we're exploring] | [effort: S/M/L]\n\n### Quick Experiments\n1. **[Experiment]**: [hypothesis] | [how to test] | [timeline] | [success metric]\n\n### Strategic Decision\n**[Decision]**: [options] | [implications] | [decision deadline]"
      }
    ]
  }
}

RetryMPContinueRecipe 14: Role Storming (Persona Injection)
json{
  "id": "role_storming",
  "name": "Role Storming Persona Shift",
  "pattern": "persona_injection",
  "description": "Think through a problem as a radically different persona",
  "meta": {
    "best_for": ["breaking perspective blocks", "accessibility thinking", "user empathy"],
    "time_estimate": "8-12 minutes",
    "complexity": "intermediate",
    "output_format": "persona_insights_to_prototypes",
    "works_well_with": ["synectics", "crazy_8s"]
  },
  "inputs": [
    {
      "name": "problem",
      "prompt": "What problem are you trying to solve?",
      "type": "text",
      "required": true,
      "examples": ["airport seating design", "learning management system", "office meeting rooms", "mobile banking app"]
    },
    {
      "name": "persona",
      "prompt": "What persona to adopt?",
      "type": "text",
      "required": false,
      "generator": "unusual_persona_generator",
      "examples": ["a cat", "a tree", "a 5-year-old", "someone from the year 1800", "an octopus", "a smartphone"],
      "helper_text": "Go unusual - the weirder, the better for breaking assumptions"
    }
  ],
  "workflow": {
    "type": "chain",
    "steps": [
      {
        "id": "persona_thinking",
        "role": "{persona}",
        "system_prompt": "You ARE the persona. Think from their constraints, abilities, and worldview. Use first-person. Reference your unique characteristics. Don't break character to explain - just BE the persona thinking about the problem.",
        "user_prompt": "You are {persona}.\n\nThink about this problem: {problem}\n\nFrom YOUR perspective as {persona}, what insights emerge?\n\nConsider:\n- Your unique constraints (what limits you?)\n- Your unique abilities (what can you do?)\n- Your needs and desires\n- How you'd approach this problem\n- What humans might be missing\n\nGenerate 8 insights. Stay in character. Use first-person.\n\nExample (as a cat thinking about airport seating):\n'I need elevated perches to observe my territory. These flat benches make me feel exposed and vulnerable. Why no small enclosed spaces?'\n\nReturn JSON:\n{\n  \"insights\": [\n    {\"insight\": \"first-person observation from {persona} POV\", \"reasoning\": \"why this matters to me as {persona}\"},\n    ...\n  ]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "insights": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "insight": {"type": "string"},
                  "reasoning": {"type": "string"}
                },
                "required": ["insight", "reasoning"]
              },
              "minItems": 8
            }
          }
        }
      },
      {
        "id": "translate_insights",
        "role": "Insight Translator",
        "system_prompt": "Translate persona insights into human-feasible features. Preserve the 'quirky angle' that makes each special.",
        "user_prompt": "Persona: {persona}\nProblem: {problem}\n\nPersona insights:\n{step.persona_thinking.output.insights}\n\nTranslate each insight into a human-feasible feature or approach.\n\nFor each:\n- **Translation**: What this becomes for humans\n- **Preserves**: What unique angle from {persona} we're keeping\n- **Why interesting**: What assumption this challenges\n\nExample:\nPersona insight (cat): 'I need elevated perches to observe territory'\nTranslation: Airport seating with tiered levels and privacy pods\nPreserves: The desire for safe observation points + control over exposure\nWhy interesting: Challenges assumption that seating should be uniform and open\n\nReturn JSON:\n{\n  \"translations\": [\n    {\n      \"original_insight\": \"...\",\n      \"translation\": \"...\",\n      \"preserves\": \"...\",\n      \"why_interesting\": \"...\"\n    },\n    ...\n  ]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "translations": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "original_insight": {"type": "string"},
                  "translation": {"type": "string"},
                  "preserves": {"type": "string"},
                  "why_interesting": {"type": "string"}
                },
                "required": ["original_insight", "translation", "preserves", "why_interesting"]
              }
            }
          }
        }
      },
      {
        "id": "select_prototypes",
        "role": "Prototype Selector",
        "system_prompt": "Select for novelty and user delight, not just practicality. The best ideas maintain the surprise factor.",
        "user_prompt": "Translated features:\n{step.translate_insights.output.translations}\n\nSelect 3 most promising for prototype development.\n\nRank by:\n- Novelty (how different from existing solutions?)\n- User delight potential\n- Feasibility (can we build this?)\n\nFor each top 3, develop:\n\n**Feature Name**: [catchy name]\n**The {persona} Insight**: What we learned from the persona\n**What It Is**: Feature description (2-3 sentences)\n**User Delight Factor**: Why people will love this\n**Implementation**: How to build (3-4 sentences)\n**Success Metric**: How we measure adoption/satisfaction\n\nFormat as markdown."
      }
    ]
  }
}

Recipe 15: Round Robin (Sequential Hand-off)
json{
  "id": "round_robin",
  "name": "Round Robin Idea Evolution",
  "pattern": "prompt_chaining_cumulative",
  "description": "Pass an idea through multiple perspectives, each building on the last",
  "meta": {
    "best_for": ["cross-functional ideation", "building completeness", "perspective diversity"],
    "time_estimate": "10-15 minutes",
    "complexity": "intermediate",
    "output_format": "evolved_concepts",
    "works_well_with": ["affinity_mapping", "storyboarding"]
  },
  "inputs": [
    {
      "name": "seed_idea",
      "prompt": "What's your starting idea?",
      "type": "text",
      "required": true,
      "examples": ["VR museum exhibit on ancient Rome", "sustainable packaging for food delivery", "remote team building activities"]
    },
    {
      "name": "perspectives",
      "prompt": "Which perspectives should build on this? (3-5 recommended)",
      "type": "array",
      "required": false,
      "default": ["designer", "engineer", "marketer", "user"],
      "examples_by_domain": {
        "product": ["product manager", "designer", "engineer", "support", "sales"],
        "creative": ["writer", "art director", "strategist", "media planner"],
        "business": ["finance", "operations", "HR", "legal", "executive"]
      }
    },
    {
      "name": "n_rounds",
      "prompt": "How many rounds?",
      "type": "integer",
      "default": 4,
      "range": [3, 6]
    }
  ],
  "workflow": {
    "type": "chain",
    "cumulative_context": true,
    "steps": [
      {
        "id": "round_{i}",
        "iteration": "for i in 1..n_rounds",
        "role": "{perspectives[i-1]}",
        "system_prompt": "Build on what came before. Add your perspective without discarding previous contributions. Reference specific elements from prior rounds.",
        "user_prompt": "{IF i == 1:\n  Starting idea: {seed_idea}\n  \n  You are a {perspectives[0]}. Add your perspective:\n  - What opportunities do you see?\n  - What would you emphasize?\n  - What concerns or constraints from your view?\n  \n  Build on the seed idea with your lens.\nELSE:\n  Previous rounds:\n  {cumulative_output}\n  \n  You are a {perspectives[i-1]} (Round {i}). Build on what's been added:\n  - Reference specific elements from previous rounds\n  - Add your unique perspective\n  - Enhance without discarding\n  \n  What does a {perspectives[i-1]} contribute to this evolving idea?\n}\n\nProvide:\n- **Your additions** (what you're contributing)\n- **Builds on** (specific references to previous rounds)\n- **Enhanced vision** (what the idea looks like now)\n\nFormat as markdown."
      }
    ],
    "final_synthesis": {
      "role": "Synthesizer",
      "prompt": "Review the full evolution:\n\n**Seed idea**: {seed_idea}\n\n**Evolution through {n_rounds} rounds**:\n{all_round_outputs}\n\nSynthesize:\n\n1. **Best evolved ideas** (top 3 versions that emerged)\n2. **Contribution history** (what each perspective added)\n3. **Key insights** (what emerged from the round-robin)\n4. **Strongest synthesis** (combine the best elements)\n\nFormat as:\n\n## Top 3 Evolved Ideas\n1. **[Idea Name]**\n   - Description\n   - Key contributions: [who added what]\n   - Why it's strong\n\n## Contribution Map\n- Round 1 ({perspectives[0]}): [summary]\n- Round 2 ({perspectives[1]}): [summary]\n...\n\n## Best Synthesis\n[Combined concept drawing from all perspectives]"
    }
  }
}

Recipe 16: Routing (General Purpose)
json{
  "id": "routing",
  "name": "Smart Input Router",
  "pattern": "routing_classification",
  "description": "Classify input and route to specialized processing",
  "meta": {
    "best_for": ["handling diverse inputs", "optimization", "workflow efficiency"],
    "time_estimate": "5-8 minutes",
    "complexity": "intermediate",
    "output_format": "routed_response",
    "works_well_with": ["any recipe as downstream processor"]
  },
  "inputs": [
    {
      "name": "input_text",
      "prompt": "Provide your input",
      "type": "text",
      "required": true,
      "multiline": true
    },
    {
      "name": "routing_categories",
      "prompt": "What categories to route between?",
      "type": "array",
      "required": true,
      "examples": [
        ["technical question", "creative request", "analysis task", "planning task"],
        ["urgent", "important", "routine"],
        ["product idea", "process improvement", "customer feedback"]
      ]
    }
  ],
  "workflow": {
    "type": "routing",
    "router": {
      "role": "Input Classifier",
      "system_prompt": "Classify accurately. When uncertain, use the category that will provide most value to the user.",
      "user_prompt": "Input:\n{input_text}\n\nCategories:\n{routing_categories}\n\nClassify this input into ONE category.\n\nReturn JSON:\n{\n  \"category\": \"selected category\",\n  \"confidence\": float (0-1),\n  \"reasoning\": \"why this category\",\n  \"metadata\": {\"any extracted key info\"}\n}",
      "output_schema": {
        "type": "object",
        "properties": {
          "category": {"type": "string"},
          "confidence": {"type": "number", "minimum": 0, "maximum": 1},
          "reasoning": {"type": "string"},
          "metadata": {"type": "object"}
        },
        "required": ["category", "confidence", "reasoning"]
      }
    },
    "workers": {
      "category_handlers": [
        {
          "category": "{routing_categories[0]}",
          "role": "{category} Handler",
          "prompt": "Handle this {category} input:\n{input_text}\n\nMetadata: {router.metadata}\n\n[Category-specific processing instructions]\n\nProvide appropriate response for this category."
        }
      ],
      "note": "Define specific handlers per category or use a general handler with category-aware prompting"
    }
  }
}

Recipe 17: Reverse Brainstorming
json{
  "id": "reverse_brainstorming",
  "name": "Reverse Brainstorming",
  "pattern": "inversion",
  "description": "Identify ways to make things worse, then flip for solutions",
  "meta": {
    "best_for": ["finding hidden risks", "challenging assumptions", "problem prevention"],
    "time_estimate": "6-10 minutes",
    "complexity": "beginner",
    "output_format": "inverted_solutions",
    "works_well_with": ["lightning_decision_jam", "starbursting"]
  },
  "inputs": [
    {
      "name": "goal",
      "prompt": "What are you trying to improve?",
      "type": "text",
      "required": true,
      "examples": ["checkout experience", "team productivity", "customer retention", "code quality"]
    }
  ],
  "workflow": {
    "type": "chain",
    "steps": [
      {
        "id": "identify_sabotage",
        "role": "Saboteur",
        "system_prompt": "Think like a villain. How could we make this WORSE? Be creative and specific with failure modes.",
        "user_prompt": "Goal: Improve {goal}\n\nInstead, let's make it WORSE.\n\nGenerate 10 specific ways to sabotage {goal}.\n\nBe creative and concrete:\n- Bad: 'make it slower'\n- Good: 'add 3 unnecessary confirmation dialogs before checkout'\n\nThink about:\n- Adding friction\n- Removing value\n- Creating confusion\n- Introducing errors\n- Alienating users\n\nReturn JSON:\n{\n  \"sabotage_moves\": [\n    {\"move\": \"specific sabotage action\", \"impact\": \"what bad thing happens\"},\n    ...\n  ]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "sabotage_moves": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "move": {"type": "string"},
                  "impact": {"type": "string"}
                },
                "required": ["move", "impact"]
              },
              "minItems": 10
            }
          }
        }
      },
      {
        "id": "invert_to_solutions",
        "role": "Solution Inverter",
        "system_prompt": "Invert each sabotage into an actionable enhancement. The inverse should directly prevent the sabotage.",
        "user_prompt": "Sabotage moves for {goal}:\n{step.identify_sabotage.output.sabotage_moves}\n\nInvert each into an actionable enhancement.\n\nFormat:\n**Sabotage**: [move]\n**Inverse Enhancement**: [specific action to prevent/reverse this]\n**Why It Works**: [brief explanation]\n**Effort**: [S/M/L]\n\nExample:\nSabotage: Add 3 unnecessary confirmation dialogs\nInverse Enhancement: Single-click checkout with optional confirmation for orders > $100\nWhy It Works: Reduces friction while maintaining safety for high-value transactions\nEffort: M\n\nReturn JSON:\n{\n  \"enhancements\": [\n    {\n      \"sabotage\": \"...\",\n      \"enhancement\": \"...\",\n      \"why_it_works\": \"...\",\n      \"effort\": \"S|M|L\"\n    },\n    ...\n  ]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "enhancements": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "sabotage": {"type": "string"},
                  "enhancement": {"type": "string"},
                  "why_it_works": {"type": "string"},
                  "effort": {"type": "string", "enum": ["S", "M", "L"]}
                },
                "required": ["sabotage", "enhancement", "why_it_works", "effort"]
              }
            }
          }
        }
      },
      {
        "id": "prioritize_enhancements",
        "role": "Enhancement Prioritizer",
        "system_prompt": "Prioritize by impact and feasibility. Quick wins (high impact, low effort) should rank highest.",
        "user_prompt": "Enhancements:\n{step.invert_to_solutions.output.enhancements}\n\nSelect top 6 enhancements.\n\nPrioritize by:\n1. Quick wins (high impact, low effort)\n2. Strategic bets (high impact, high effort)\n3. Easy improvements (medium impact, low effort)\n\nFor each, provide:\n- **Enhancement**\n- **Impact** (1-5)\n- **Effort** (S/M/L)\n- **Priority** (High/Medium)\n- **Implementation notes** (2-3 sentences)\n\nFormat as markdown table:\n| Priority | Enhancement | Impact | Effort | Implementation Notes |"
      }
    ]
  }
}

Recipe 18: Rapid Ideation
json{
  "id": "rapid_ideation",
  "name": "Rapid Ideation Sprint",
  "pattern": "high_volume_generation",
  "description": "Generate large quantity of ideas quickly, then filter for quality",
  "meta": {
    "best_for": ["content calendars", "campaign ideas", "feature brainstorming"],
    "time_estimate": "5-10 minutes",
    "complexity": "beginner",
    "output_format": "filtered_ideas",
    "works_well_with": ["affinity_mapping", "crazy_8s"]
  },
  "inputs": [
    {
      "name": "topic",
      "prompt": "What do you need ideas for?",
      "type": "text",
      "required": true,
      "examples": ["Earth Day social posts", "podcast episode topics", "email subject lines", "product features"]
    },
    {
      "name": "context",
      "prompt": "Any context or constraints?",
      "type": "text",
      "required": false,
      "examples": ["B2B audience", "educational tone", "under 280 characters", "accessible to beginners"]
    },
    {
      "name": "quantity",
      "prompt": "How many ideas to generate?",
      "type": "integer",
      "default": 50,
      "range": [20, 100]
    },
    {
      "name": "select_top",
      "prompt": "How many to polish?",
      "type": "integer",
      "default": 10,
      "range": [5, 20]
    }
  ],
  "workflow": {
    "type": "chain",
    "steps": [
      {
        "id": "generate_flood",
        "role": "Rapid Ideator",
        "system_prompt": "QUANTITY over quality right now. Generate quickly. Embrace variety. Don't self-censor. Raw ideas are fine.",
        "user_prompt": "Generate {quantity} ideas for: {topic}\n\nContext: {context}\n\nRules:\n- Be fast (quantity matters)\n- Embrace variety (different angles)\n- Don't filter yet (raw is OK)\n- One line per idea\n- Number each idea\n\nReturn as simple JSON:\n{\n  \"ideas\": [\"idea 1\", \"idea 2\", ...]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "ideas": {
              "type": "array",
              "items": {"type": "string"}
            }
          },
          "required": ["ideas"]
        }
      },
      {
        "id": "filter_and_polish",
        "role": "Idea Curator",
        "system_prompt": "Filter for quality. Select ideas with potential. Balance proven concepts with novel angles.",
        "user_prompt": "Raw ideas ({quantity} total):\n{step.generate_flood.output.ideas}\n\nSelect top {select_top} ideas based on:\n- Originality (not generic)\n- Clarity (immediately understandable)\n- Relevance (fits {topic} and {context})\n- Engagement potential (will this resonate?)\n\nFor each selected idea:\n- Polish the phrasing\n- Add brief rationale (why this one?)\n- Mark with ⭐ if it's particularly strong\n\nReturn JSON:\n{\n  \"selected_ideas\": [\n    {\n      \"original\": \"raw idea\",\n      \"polished\": \"improved version\",\n      \"rationale\": \"why selected\",\n      \"standout\": boolean\n    },\n    ...\n  ]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "selected_ideas": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "original": {"type": "string"},
                  "polished": {"type": "string"},
                  "rationale": {"type": "string"},
                  "standout": {"type": "boolean"}
                },
                "required": ["original", "polished", "rationale", "standout"]
              }
            }
          }
        }
      },
      {
        "id": "format_output",
        "role": "Output Formatter",
        "prompt": "Format selected ideas for easy use:\n\n## Top {select_top} Ideas for {topic}\n\n### ⭐ Standouts\n[List standout ideas]\n\n### Selected Ideas\n[List remaining polished ideas with rationales]\n\n### Alternative Angles\n[From the raw list, call out 3-5 interesting alternative directions not in top {select_top}]"
      }
    ]
  }
}

Recipe 19: World Café (Virtual)
json{
  "id": "world_cafe",
  "name": "World Café (Virtual)",
  "pattern": "multi_round_dialogue",
  "description": "Simulate rotating dialogue rounds on a topic",
  "meta": {
    "best_for": ["complex topics", "team alignment", "collective sensemaking"],
    "time_estimate": "15-20 minutes",
    "complexity": "advanced",
    "output_format": "collective_insights",
    "works_well_with": ["affinity_mapping", "synthesis"]
  },
  "inputs": [
    {
      "name": "central_topic",
      "prompt": "What's the central topic for dialogue?",
      "type": "text",
      "required": true,
      "examples": ["remote work culture", "product strategy for 2025", "customer experience vision", "innovation practices"]
    },
    {
      "name": "n_rounds",
      "prompt": "How many dialogue rounds?",
      "type": "integer",
      "default": 3,
      "range": [2, 4]
    }
  ],
  "workflow": {
    "type": "iterative",
    "max_loops": "{n_rounds}",
    "state_schema": {
      "round_themes": "array",
      "accumulated_insights": "array",
      "cross_pollination": "array"
    },
    "initial_state": {
      "round_themes": [],
      "accumulated_insights": [],
      "cross_pollination": []
    },
    "steps": [
      {
        "id": "define_round_question",
        "condition": "loop == 1 OR new round",
        "role": "Café Host",
        "system_prompt": "Each round should explore a different facet of the central topic. Questions should be open-ended and generative.",
        "user_prompt": "{IF loop == 1:\n  Central topic: {central_topic}\n  \n  Design {n_rounds} seed questions for World Café rounds.\n  \n  Each question should:\n  - Explore a different dimension of {central_topic}\n  - Be open-ended\n  - Invite diverse perspectives\n  - Build on previous rounds (for rounds 2+)\n  \n  Return JSON:\n  {\n    \"round_questions\": [\n      {\"round\": 1, \"question\": \"...\", \"focus\": \"what dimension this explores\"},\n      ...\n    ]\n  }\nELSE:\n  Current round: {loop}\n  Question for this round: {state.round_themes[loop-1]}\n  \n  Previous insights:\n  {state.accumulated_insights}\n}"
      },
      {
        "id": "dialogue_simulation",
        "role": "Dialogue Participants",
        "system_prompt": "Simulate diverse perspectives in dialogue. Build on each other's ideas. Look for connections and tensions.",
        "user_prompt": "World Café Round {loop}/{n_rounds}\n\nQuestion: {current_round_question}\n\nContext from previous rounds:\n{state.accumulated_insights}\n\nSimulate a rich dialogue with 4-5 diverse perspectives:\n- Practitioner view\n- Strategic view\n- User/customer view\n- Skeptical view\n- Aspirational view\n\nEach perspective should:\n- Respond to the question\n- Build on or challenge other perspectives\n- Surface tensions or insights\n\nReturn JSON:\n{\n  \"dialogue\": [\n    {\"perspective\": \"...\", \"contribution\": \"...\", \"builds_on\": \"previous perspective or null\"},\n    ...\n  ],\n  \"emerging_themes\": [\"theme 1\", \"theme 2\", ...],\n  \"key_tensions\": [\"tension 1\", ...]\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "dialogue": {"type": "array"},
            "emerging_themes": {"type": "array", "items": {"type": "string"}},
            "key_tensions": {"type": "array", "items": {"type": "string"}}
          }
        }
      },
      {
        "id": "harvest_round",
        "role": "Harvest Facilitator",
        "prompt": "From this round's dialogue:\n{step.dialogue_simulation.output}\n\nHarvest:\n- Top 3 insights\n- Patterns connecting to previous rounds\n- New questions that emerged\n\nReturn JSON:\n{\n  \"round\": {loop},\n  \"insights\": [\"insight 1\", ...],\n  \"connections_to_previous\": [\"pattern 1\", ...],\n  \"new_questions\": [\"question 1\", ...]\n}"
      }
    ],
    "state_update": {
      "accumulated_insights": "append(step.harvest_round.output.insights)",
      "cross_pollination": "append(step.harvest_round.output.connections_to_previous)"
    },
    "final_synthesis": {
      "role": "Collective Insight Synthesizer",
      "prompt": "Synthesize {n_rounds} rounds of World Café dialogue on: {central_topic}\n\nAll rounds:\n{iteration_summary}\n\nCross-pollination patterns:\n{state.cross_pollination}\n\nCreate a visual synthesis:\n\n## Collective Insights: {central_topic}\n\n### Core Themes\n[Themes that emerged across rounds]\n\n### Key Tensions\n[Productive tensions or polarities]\n\n### Surprising Connections\n[Unexpected patterns across perspectives]\n\n### Actionable Insights\n[What can be acted on]\n\n### Open Questions\n[What remains to explore]\n\nFormat as rich markdown with clear structure."
    }
  }
}

Recipe 20: Brain Netting (Asynchronous)
json{
  "id": "brain_netting",
  "name": "Brain Netting (Async Ideation)",
  "pattern": "asynchronous_accumulation",
  "description": "Simulate asynchronous online idea contribution and building",
  "meta": {
    "best_for": ["distributed teams", "ongoing ideation", "inclusive participation"],
    "time_estimate": "10-15 minutes (simulates longer async process)",
    "complexity": "intermediate",
    "output_format": "evolved_idea_threads",
    "works_well_with": ["affinity_mapping", "brainwriting_635"]
  },
  "inputs": [
    {
      "name": "prompt_question",
      "prompt": "What question/prompt for the brain net?",
      "type": "text",
      "required": true,
      "examples": ["new brand mascot ideas", "ways to improve onboarding", "product naming concepts", "team ritual ideas"]
    },
    {
      "name": "n_waves",
      "prompt": "How many contribution waves?",
      "type": "integer",
      "default": 5,
      "range": [3, 7]
    },
    {
      "name": "ideas_per_wave",
      "prompt": "Ideas per wave?",
      "type": "integer",
      "default": 4,
      "range": [3, 6]
    }
  ],
  "workflow": {
    "type": "iterative",
    "max_loops": "{n_waves}",
    "state_schema": {
      "idea_board": "array",
      "threads": "object",
      "wave_summaries": "array"
    },
    "initial_state": {
      "idea_board": [],
      "threads": {},
      "wave_summaries": []
    },
    "steps": [
      {
        "id": "contribute_wave",
        "role": "Wave {loop} Contributors",
        "system_prompt": "Some contributors start new ideas, others build on existing ones. Simulate natural async behavior - mix of new and evolved ideas.",
        "user_prompt": "Brain Net Prompt: {prompt_question}\n\nWave: {loop}/{n_waves}\n\nCurrent idea board:\n{state.idea_board}\n\n{IF loop == 1:\n  Generate {ideas_per_wave} initial ideas.\n  \n  Return JSON:\n  {\n    \"contributions\": [\n      {\"type\": \"new\", \"idea\": \"...\", \"contributor\": \"Person {i}\"},\n      ...\n    ]\n  }\nELSE:\n  Generate {ideas_per_wave} contributions. Mix:\n  - Some NEW ideas\n  - Some BUILDS on existing ideas (reference them)\n  \n  Return JSON:\n  {\n    \"contributions\": [\n      {\"type\": \"new|build\", \"idea\": \"...\", \"builds_on_id\": \"id or null\", \"contributor\": \"Person {i}\"},\n      ...\n    ]\n  }\n}",
        "output_schema": {
          "type": "object",
          "properties": {
            "contributions": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "type": {"type": "string", "enum": ["new", "build"]},
                  "idea": {"type": "string"},
                  "builds_on_id": {"type": ["string", "null"]},
                  "contributor": {"type": "string"}
                },
                "required": ["type", "idea", "contributor"]
              }
            }
          }
        }
      },
      {
        "id": "update_board",
        "role": "Board Manager",
        "prompt": "Process wave {loop} contributions:\n{step.contribute_wave.output.contributions}\n\nTasks:\n1. Add new ideas to board with IDs\n2. Link build-on ideas to their parents (create threads)\n3. Summarize this wave's activity\n\nReturn JSON:\n{\n  \"new_board_state\": [all ideas with IDs and parent links],\n  \"identified_threads\": [{\"thread_id\": \"...\", \"ideas\": [...]}],\n  \"wave_summary\": \"brief summary of wave activity\"\n}"
      }
    ],
    "state_update": {
      "idea_board": "{step.update_board.output.new_board_state}",
      "threads": "{merge(state.threads, step.update_board.output.identified_threads)}",
      "wave_summaries": "append({wave: loop, summary: step.update_board.output.wave_summary})"
    },
    "final_synthesis": {
      "role": "Brain Net Synthesizer",
      "prompt": "Brain Net complete: {n_waves} waves on '{prompt_question}'\n\nFinal board:\n{state.idea_board}\n\nThreads (ideas that were built upon):\n{state.threads}\n\nWave summaries:\n{state.wave_summaries}\n\nSynthesize:\n\n## Brain Net Results: {prompt_question}\n\n### Overview\n- Total ideas: {count}\n- Active threads: {count threads}\n- Waves: {n_waves}\n\n### Strongest Threads\n[Top 3 threads that evolved most]\n\nFor each:\n- Thread evolution (original → build 1 → build 2 → final form)\n- Why this thread resonated\n- Recommended next step\n\n### Standalone Gems\n[Top 3 ideas that didn't get built on but are strong]\n\n### Patterns\n[What themes emerged across contributions]\n\nFormat as markdown."
    }
  }
}