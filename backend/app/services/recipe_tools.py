"""
Recipe Tool Wrapper Layer
Converts recipes into callable tools with OpenAI function schemas.
Follows existing patterns: Pydantic models, async/await, reuses unified_runner.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.models import Recipe, InputDefinition
from app.services.unified_runner import run_recipe
import json


class ToolSchema(BaseModel):
    """Pydantic model for OpenAI function tool schema"""
    type: str = "function"
    function: Dict[str, Any]


class RecipeTool:
    """
    Wrapper that makes any recipe callable as an OpenAI function tool.
    Reuses existing run_recipe() infrastructure for consistency.
    """

    def __init__(self, recipe: Recipe):
        self.recipe = recipe
        self.id = recipe.id
        self.name = recipe.name
        self.description = recipe.description

    async def execute(self, user_id: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """
        Execute recipe with provided parameters.
        Reuses unified_runner.run_recipe() for consistency.

        Args:
            user_id: Optional user ID for profile injection
            **kwargs: Recipe-specific parameters

        Returns:
            Parsed JSON result from recipe execution
        """
        # Add user_id to params if provided
        params = dict(kwargs)
        if user_id:
            params["user_id"] = user_id

        # Use existing unified runner (reuses all runner infrastructure)
        result_json = await run_recipe(self.recipe, params)

        # Parse and return
        return json.loads(result_json)

    def to_openai_function_schema(self) -> ToolSchema:
        """
        Generate OpenAI function calling schema from recipe definition.
        Supports both legacy string inputs and new InputDefinition format.

        Returns:
            ToolSchema with OpenAI function format
        """
        properties = {}
        required = []

        # Handle legacy format: inputs = ["problem", "loops=3"]
        if self.recipe.inputs and isinstance(self.recipe.inputs[0], str):
            for input_def in self.recipe.inputs:
                if "=" in input_def:
                    # Optional with default (e.g., "loops=3")
                    param_name, default_value = input_def.split("=", 1)
                    properties[param_name] = {
                        "type": self._infer_type(default_value),
                        "description": f"Optional parameter (default: {default_value})"
                    }
                else:
                    # Required parameter
                    param_name = input_def
                    properties[param_name] = {
                        "type": "string",
                        "description": f"Required parameter: {param_name}"
                    }
                    required.append(param_name)

        # Handle new format: inputs = [InputDefinition(...)]
        elif self.recipe.inputs and isinstance(self.recipe.inputs[0], (dict, InputDefinition)):
            for input_def in self.recipe.inputs:
                # Convert dict to InputDefinition if needed
                if isinstance(input_def, dict):
                    input_def = InputDefinition(**input_def)

                # Build property schema
                prop_schema = {
                    "type": self._map_type(input_def.type),
                    "description": input_def.prompt or f"Parameter: {input_def.name}"
                }

                # Add examples if available
                if input_def.examples:
                    prop_schema["examples"] = input_def.examples

                # Add range constraint for integers
                if input_def.range and input_def.type == "integer":
                    prop_schema["minimum"] = input_def.range[0]
                    prop_schema["maximum"] = input_def.range[1]

                properties[input_def.name] = prop_schema

                if input_def.required:
                    required.append(input_def.name)

        return ToolSchema(
            type="function",
            function={
                "name": self.recipe.id,
                "description": self.recipe.description,
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    "required": required,
                    "additionalProperties": False
                }
            }
        )

    @staticmethod
    def _infer_type(value: str) -> str:
        """Infer JSON schema type from default value string"""
        if value.isdigit():
            return "integer"
        if value.lower() in ("true", "false"):
            return "boolean"
        return "string"

    @staticmethod
    def _map_type(input_type: str) -> str:
        """Map InputDefinition type to JSON schema type"""
        type_mapping = {
            "text": "string",
            "integer": "integer",
            "boolean": "boolean",
            "array": "array"
        }
        return type_mapping.get(input_type, "string")


class RecipeToolRegistry:
    """
    Registry for all available recipe tools.
    Follows singleton-ish pattern used in routers.
    """

    def __init__(self, recipes: List[Recipe]):
        self._tools: Dict[str, RecipeTool] = {}
        for recipe in recipes:
            self._tools[recipe.id] = RecipeTool(recipe)

    def get_tool(self, recipe_id: str) -> Optional[RecipeTool]:
        """Get tool by recipe ID"""
        return self._tools.get(recipe_id)

    def list_tool_schemas(self) -> List[Dict[str, Any]]:
        """
        Return OpenAI function schemas for all recipes.
        Used by agent to know what tools are available.
        """
        return [tool.to_openai_function_schema().model_dump() for tool in self._tools.values()]

    def get_tool_names(self) -> List[str]:
        """Get list of all tool IDs"""
        return list(self._tools.keys())

    async def execute_tool(
        self,
        recipe_id: str,
        user_id: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Execute a tool by ID.
        Convenience method for agent to call tools.

        Args:
            recipe_id: Recipe ID to execute
            user_id: Optional user ID for profile injection
            **kwargs: Recipe-specific parameters

        Returns:
            Execution result

        Raises:
            ValueError: If recipe not found
        """
        tool = self.get_tool(recipe_id)
        if not tool:
            raise ValueError(f"Recipe not found: {recipe_id}")
        return await tool.execute(user_id=user_id, **kwargs)

    def get_registry_info(self) -> Dict[str, Any]:
        """Get information about all registered tools"""
        return {
            "total_tools": len(self._tools),
            "tool_ids": self.get_tool_names(),
            "tool_details": [
                {
                    "id": tool.id,
                    "name": tool.name,
                    "description": tool.description
                }
                for tool in self._tools.values()
            ]
        }
