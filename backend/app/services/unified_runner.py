import json
from typing import Dict, Any
from ..models import Recipe
from ..models_user import UserProfile
from .runner_factory import RunnerFactory
from .runner import load_profile  # Import profile loading function


async def run_recipe(recipe: Recipe, params: Dict[str, Any]) -> str:
    """
    Unified recipe runner that automatically selects appropriate runner type
    and executes with profile-aware personalization
    """
    # Load user profile
    user_id = params.get("user_id")
    profile = load_profile(user_id)
    
    # Validate recipe configuration
    is_valid, error_message = RunnerFactory.validate_recipe_for_runner(recipe)
    if not is_valid:
        raise ValueError(f"Invalid recipe configuration: {error_message}")
    
    # Create appropriate runner
    runner = RunnerFactory.create_runner(recipe, profile)
    
    # Execute recipe
    result = await runner.run(recipe, params)
    
    # Return as JSON string for compatibility with existing API
    return json.dumps(result, ensure_ascii=False)


def get_runner_info(recipe: Recipe) -> Dict[str, Any]:
    """Get information about what runner would be used for a recipe"""
    runner_type = RunnerFactory._determine_runner_type(recipe)
    is_valid, validation_message = RunnerFactory.validate_recipe_for_runner(recipe)
    
    return {
        "runner_type": runner_type,
        "is_valid": is_valid,
        "validation_message": validation_message,
        "available_runners": RunnerFactory.get_available_runner_types()
    }


# Backward compatibility functions
async def run_one_shot(recipe: Recipe, params: Dict[str, Any]) -> str:
    """Legacy function for backward compatibility"""
    return await run_recipe(recipe, params)


async def run_iterative_generic(recipe: Recipe, params: Dict[str, Any], loops: int = None) -> str:
    """Legacy function for backward compatibility"""
    if loops is not None:
        params = params.copy()
        params["loops"] = loops
    return await run_recipe(recipe, params)