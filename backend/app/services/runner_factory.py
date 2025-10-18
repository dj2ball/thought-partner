from typing import Optional
from ..models import Recipe
from ..models_user import UserProfile
from .base_runner import BaseRunner
from .runners.single_shot import SingleShotRunner
from .runners.chain import ChainRunner
from .runners.parallel import ParallelRunner
from .runners.iterative import IterativeRunner
from .runners.orchestrator import OrchestratorRunner
from .runners.routing import RoutingRunner


class RunnerFactory:
    """Factory for creating appropriate runners based on recipe configuration"""
    
    @staticmethod
    def create_runner(recipe: Recipe, profile: Optional[UserProfile] = None) -> BaseRunner:
        """Create appropriate runner instance based on recipe type"""
        
        # Determine runner type from recipe
        runner_type = RunnerFactory._determine_runner_type(recipe)
        
        # Runner type mapping
        runners = {
            "single_shot": SingleShotRunner,
            "chain": ChainRunner,
            "parallel": ParallelRunner,
            "iterative": IterativeRunner,
            "orchestrator": OrchestratorRunner,
            "routing": RoutingRunner
        }
        
        if runner_type not in runners:
            raise ValueError(f"Unknown runner type: {runner_type}")
        
        return runners[runner_type](profile)
    
    @staticmethod
    def _determine_runner_type(recipe: Recipe) -> str:
        """Determine the appropriate runner type from recipe configuration"""
        
        # Check explicit workflow type first
        if hasattr(recipe, 'workflow') and recipe.workflow and hasattr(recipe.workflow, 'type'):
            return recipe.workflow.type
        
        # Fallback to legacy run_mode for backward compatibility
        if recipe.run_mode == "iterative" or recipe.iterative:
            return "iterative"
        elif recipe.run_mode == "one-shot":
            return "single_shot"
        
        # Default to single_shot
        return "single_shot"
    
    @staticmethod
    def get_available_runner_types() -> list[str]:
        """Get list of all available runner types"""
        return ["single_shot", "chain", "parallel", "iterative", "orchestrator", "routing"]
    
    @staticmethod
    def validate_recipe_for_runner(recipe: Recipe) -> tuple[bool, str]:
        """Validate that recipe configuration is compatible with its runner type"""
        
        runner_type = RunnerFactory._determine_runner_type(recipe)
        
        if runner_type == "iterative":
            if not recipe.iterative:
                return False, "Iterative recipes must have 'iterative' configuration"
        
        elif runner_type == "chain":
            if not (hasattr(recipe, 'workflow') and recipe.workflow and 
                   hasattr(recipe.workflow, 'chain') and recipe.workflow.chain):
                return False, "Chain recipes must have 'workflow.chain' configuration"
        
        elif runner_type == "parallel":
            if not (hasattr(recipe, 'workflow') and recipe.workflow and 
                   hasattr(recipe.workflow, 'parallel') and recipe.workflow.parallel):
                return False, "Parallel recipes must have 'workflow.parallel' configuration"
        
        elif runner_type == "orchestrator":
            if not (hasattr(recipe, 'workflow') and recipe.workflow and 
                   hasattr(recipe.workflow, 'orchestrator') and recipe.workflow.orchestrator):
                return False, "Orchestrator recipes must have 'workflow.orchestrator' configuration"
        
        elif runner_type == "routing":
            if not (hasattr(recipe, 'workflow') and recipe.workflow and 
                   hasattr(recipe.workflow, 'router') and recipe.workflow.router):
                return False, "Routing recipes must have 'workflow.router' configuration"
        
        return True, "Recipe configuration is valid"
    
    @staticmethod
    def get_runner_info(recipe: Recipe) -> dict:
        """Get runner type and validation info for a recipe"""
        
        runner_type = RunnerFactory._determine_runner_type(recipe)
        is_valid, validation_message = RunnerFactory.validate_recipe_for_runner(recipe)
        
        return {
            "runner_type": runner_type,
            "is_valid": is_valid,
            "validation_message": validation_message,
            "recipe_id": recipe.id,
            "recipe_name": recipe.name
        }