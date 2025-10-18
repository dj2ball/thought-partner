Anthropic Paper Recommendations Summary
Based on the Anthropic paper "Building Effective AI Agents", here are the key pattern recommendations integrated across recipes:
1. Start Simple, Add Complexity Only When Needed

Most recipes default to simpler modes (e.g., Crazy 8s is single-shot parallelization, not iterative)
Progressive disclosure: basic inputs required, advanced inputs optional
Exit conditions prevent unnecessary iterations

2. Prompt Engineering Best Practices
json{
  "system_prompt_patterns": {
    "avoid_sycophancy": "Avoid hedging. Challenge assumptions. Don't flatter.",
    "be_specific": "Prefer concrete examples over abstract principles",
    "use_constraints": "Banned phrases, required elements, format specs",
    "show_reasoning": "Explain why this matters, not just what to do"
  }
}
3. Schema-Enforced Outputs
All recipes that need structured data use JSON schemas:
json{
  "output_schema": {
    "type": "object",
    "properties": {...},
    "required": [...],
    "additionalProperties": false
  }
}
4. Evaluator-Optimizer Pattern
Implemented in:

Storyboarding (quality gates)
Brainwriting (theme tracking)
Lightning Decision Jam (voting)

5. Orchestrator-Workers Pattern
Implemented in:

Starbursting (planner → workers → synthesizer)
Morphological Matrix (sampler → evaluators → developer)
World Café (host → participants → harvester)

6. Transparency & Debuggability
json{
  "ui_preferences": {
    "show_intermediate_steps": true,
    "show_reasoning": true,
    "allow_step_retry": true
  }
}

Modular Runner Architecture
Core Runner Types
typescript// runners/single_shot.ts
async function runSingleShot(recipe: Recipe, inputs: Inputs): Promise<Result> {
  const prompt = buildPrompt(recipe.workflow.prompt_template, inputs);
  const response = await llm.generate(prompt, recipe.workflow.constraints);
  return formatOutput(response, recipe.output_format);
}

// runners/prompt_chain.ts
async function runPromptChain(recipe: Recipe, inputs: Inputs): Promise<Result> {
  let context = inputs;
  const outputs = [];
  
  for (const step of recipe.workflow.steps) {
    const prompt = buildPrompt(step.user_prompt, context);
    const response = await llm.generate(prompt, step.system_prompt, step.output_schema);
    outputs.push({ step: step.id, output: response });
    
    // Accumulate context if cumulative
    if (recipe.workflow.cumulative_context) {
      context = { ...context, [`step.${step.id}.output`]: response };
    } else {
      context = { ...inputs, previous_output: response };
    }
  }
  
  return synthesize(outputs, recipe.final_synthesis);
}

// runners/parallel.ts
async function runParallel(recipe: Recipe, inputs: Inputs): Promise<Result> {
  const parallelConfig = recipe.workflow.parallel;
  
  if (parallelConfig.branches) {
    // Sectioning pattern
    const promises = parallelConfig.branches.map(branch => 
      llm.generate(
        buildPrompt(branch.prompt, inputs),
        branch.system_prompt
      )
    );
    const results = await Promise.all(promises);
    return aggregate(results, parallelConfig.aggregator);
  }
  
  if (parallelConfig.voting) {
    // Voting pattern
    const promises = Array(parallelConfig.voting.n_variations).fill(null).map((_, i) =>
      llm.generate(
        buildPrompt(parallelConfig.voting.variation_template.user_prompt, { ...inputs, i: i + 1 }),
        parallelConfig.voting.variation_template.system_prompt,
        { temperature: getDiversityTemp(i, parallelConfig.voting.diversity_injection) }
      )
    );
    const variations = await Promise.all(promises);
    return aggregate(variations, parallelConfig.aggregator);
  }
}

// runners/iterative.ts
async function runIterative(recipe: Recipe, inputs: Inputs): Promise<Result> {
  let state = initializeState(recipe.workflow.initial_state, inputs);
  const history = [];
  
  for (let loop = 1; loop <= recipe.workflow.max_loops; loop++) {
    const stepOutputs = {};
    
    for (const step of recipe.workflow.steps) {
      // Check conditions
      if (step.condition && !evaluateCondition(step.condition, { loop, state })) {
        continue;
      }
      
      const prompt = buildPrompt(step.user_prompt, { ...inputs, loop, state, ...stepOutputs });
      const response = await llm.generate(prompt, step.system_prompt, step.output_schema);
      stepOutputs[step.id] = response;
    }
    
    // Update state
    state = updateState(state, stepOutputs, recipe.workflow.state_update);
    history.push({ loop, state: deepClone(state), outputs: stepOutputs });
    
    // Check exit condition
    if (recipe.workflow.exit_condition && evaluateCondition(recipe.workflow.exit_condition, { loop, state })) {
      break;
    }
  }
  
  // Final synthesis
  if (recipe.workflow.final_synthesis) {
    return await synthesize(history, state, recipe.workflow.final_synthesis);
  }
  
  return { state, history };
}

// runners/orchestrator.ts
async function runOrchestrator(recipe: Recipe, inputs: Inputs): Promise<Result> {
  const orchConfig = recipe.workflow.orchestrator;
  
  // 1. Planning phase
  const plan = await llm.generate(
    buildPrompt(orchConfig.planner.user_prompt, inputs),
    orchConfig.planner.system_prompt,
    orchConfig.planner.output_schema
  );
  
  // 2. Worker delegation
  const workerPromises = [];
  
  if (orchConfig.workers.iteration) {
    // Iterate over planned items
    const items = extractIterationItems(plan, orchConfig.workers.iteration);
    for (const item of items) {
      workerPromises.push(
        llm.generate(
          buildPrompt(orchConfig.workers.user_prompt, { ...inputs, ...item, plan }),
          buildPrompt(orchConfig.workers.role, item),
          orchConfig.workers.output_schema
        )
      );
    }
  } else {
    // Fixed workers
    for (const worker of orchConfig.workers) {
      workerPromises.push(
        llm.generate(
          buildPrompt(worker.prompt, { ...inputs, plan }),
          worker.role
        )
      );
    }
  }
  
  const workerResults = await Promise.all(workerPromises);
  
  // 3. Synthesis
  return await llm.generate(
    buildPrompt(orchConfig.synthesizer.prompt, { ...inputs, plan, worker_outputs: workerResults }),
    orchConfig.synthesizer.role,
    orchConfig.synthesizer.output_schema
  );
}

// runners/routing.ts
async function runRouting(recipe: Recipe, inputs: Inputs): Promise<Result> {
  const routingConfig = recipe.workflow;
  
  // 1. Classification
  const routerResult = await llm.generate(
    buildPrompt(routingConfig.router.user_prompt, inputs),
    routingConfig.router.system_prompt,
    routingConfig.router.output_schema
  );
  
  // 2. Find matching worker
  const category = routerResult.category;
  const worker = routingConfig.workers.find(w => w.category === category) 
    || routingConfig.workers.find(w => w.category === 'default');
  
  if (!worker) {
    throw new Error(`No worker found for category: ${category}`);
  }
  
  // 3. Execute worker
  const workerResult = await llm.generate(
    buildPrompt(worker.prompt, { ...inputs, router: routerResult }),
    worker.role
  );
  
  return {
    routing: routerResult,
    result: workerResult
  };
}