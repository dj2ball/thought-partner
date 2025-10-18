from fastapi import APIRouter, HTTPException
from ..models import RunRequest, RunResponse
from ..recipes import RECIPES
from ..config import settings
from ..services import runner as native_runner
from ..services import langchain_runner as lc_runner
from ..services import unified_runner
import json

router = APIRouter(prefix="/run", tags=["run"])

@router.post("")
async def run(req: RunRequest) -> RunResponse:
    print(f"Available recipes: {list(RECIPES.keys())}")
    print(f"Requested recipe: {req.recipe_id}")
    if req.recipe_id not in RECIPES:
        raise HTTPException(404, f"Unknown recipe '{req.recipe_id}'. Available: {list(RECIPES.keys())}")
    
    recipe = RECIPES[req.recipe_id]
    
    # Use unified runner (with fallback to legacy runners)
    try:
        # Add loops to params if specified
        params = req.params.copy()
        if req.loops is not None:
            params["loops"] = req.loops
        
        # Try new unified runner first
        output = await unified_runner.run_recipe(recipe, params)
        
        # Parse result to get mode info
        result_data = json.loads(output)
        mode = result_data.get("mode", "auto")
        
    except Exception as e:
        print(f"Unified runner failed, falling back to legacy: {e}")
        # Fallback to legacy runners
        mode = req.mode
        if mode == "auto":
            # Determine mode based on recipe type
            if recipe.iterative:
                mode = "iterative"
            elif recipe.workflow and recipe.workflow.type in ["chain", "parallel", "orchestrator", "routing"]:
                # New workflow types default to one-shot for legacy compatibility
                mode = "one-shot"
            else:
                mode = "one-shot"
        
        # Only use legacy runners for recipes that are compatible
        if mode == "iterative" and recipe.iterative:
            if settings.use_langchain:
                output = await lc_runner.run_iterative_generic(recipe, req.params, req.loops)
            else:
                output = await native_runner.run_iterative_generic(recipe, req.params, req.loops)
        elif mode == "one-shot":
            if settings.use_langchain:
                output = await lc_runner.run_one_shot(recipe, req.params)
            else:
                output = await native_runner.run_one_shot(recipe, req.params)
        else:
            # If we can't handle it with legacy runners, re-raise the original error
            raise e
    
    try:
        parsed = json.loads(output)
    except Exception:
        parsed = output
    
    return RunResponse(recipe_id=recipe.id, mode=mode, output=parsed, meta={"model": settings.openai_model})


@router.get("/runner-info/{recipe_id}")
async def get_runner_info(recipe_id: str):
    """Get information about what runner would be used for a recipe"""
    if recipe_id not in RECIPES:
        raise HTTPException(404, f"Unknown recipe '{recipe_id}'. Available: {list(RECIPES.keys())}")
    
    recipe = RECIPES[recipe_id]
    return unified_runner.get_runner_info(recipe)