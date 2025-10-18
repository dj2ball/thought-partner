# Recipe-as-Tools Implementation Plan

## Overview
This plan outlines how to make existing recipes dynamically callable as tools for an orchestrator, enabling dynamic routing based on user input without modifying current recipe functionality.

## Current State Analysis

### What We Have:
1. **Clean Recipe System**: Well-structured recipes with defined inputs/outputs in `brainstorm_recipes.json`
2. **Unified Runner**: `run_recipe()` provides a single entry point to execute any recipe
3. **Factory Pattern**: RunnerFactory handles all runner type selection complexity
4. **JSON In/Out**: Recipes already work with structured JSON inputs and outputs
5. **Async Architecture**: Everything is already async-ready
6. **6 Runner Types**: single_shot, iterative, parallel, chain, routing, orchestrator

### Architecture Benefits:
- Recipes are self-contained with metadata
- Clear separation between recipe definition and execution
- Existing orchestrator runner can already coordinate multiple operations
- No tight coupling between recipes

## Implementation Plan

### Phase 1: Tool Wrapper Layer (2-3 hours)

#### 1. Create `app/services/recipe_tools.py`:
```python
class RecipeTool:
    """Wrapper that makes any recipe callable as a tool"""
    
    def __init__(self, recipe: Recipe):
        self.recipe = recipe
        self.name = recipe.id
        self.description = recipe.description
        
    async def __call__(self, **kwargs) -> Dict[str, Any]:
        """Execute recipe with provided parameters"""
        result = await run_recipe(self.recipe, kwargs)
        return json.loads(result)
    
    def get_schema(self) -> Dict[str, Any]:
        """Generate OpenAI function calling schema from recipe inputs"""
        # Convert recipe.inputs to JSON schema format
```

#### 2. Tool Registry:
```python
class RecipeToolRegistry:
    """Registry for all available recipe tools"""
    
    def __init__(self):
        self._tools = {}
        self._load_all_recipes()
    
    def get_tool(self, recipe_id: str) -> RecipeTool:
        return self._tools.get(recipe_id)
    
    def list_tools(self) -> List[Dict[str, Any]]:
        """Return tool metadata for all recipes"""
```

### Phase 2: Integration Options

#### Option A: Native REST API Integration (1-2 hours)
1. **Add endpoints to `app/routers/recipes.py`**:
   - `GET /api/tools` - List all available recipe tools with metadata
   - `POST /api/tools/{recipe_id}/execute` - Execute a specific recipe as a tool
   - `GET /api/tools/{recipe_id}/schema` - Get input/output schema

2. **Benefits**:
   - Simple HTTP interface
   - Works with any client
   - Orchestrator can call via HTTP

#### Option B: LangChain Integration (2-3 hours)
1. **Create `app/services/langchain_tools.py`**:
```python
from langchain.tools import StructuredTool

def recipe_to_langchain_tool(recipe: Recipe) -> StructuredTool:
    """Convert a recipe to a LangChain tool"""
    return StructuredTool.from_function(
        func=lambda **kwargs: run_recipe(recipe, kwargs),
        name=recipe.id,
        description=recipe.description,
        args_schema=generate_pydantic_model(recipe.inputs)
    )
```

2. **Add LangChain Agent**:
   - Agent that can select appropriate recipe based on user query
   - Automatic tool selection and execution
   - Built-in conversation memory

### Phase 3: Dynamic Recipe Routing (1-2 hours)

#### Simple Classifier Approach:
```python
class RecipeRouter:
    """Routes user queries to appropriate recipes"""
    
    def __init__(self, registry: RecipeToolRegistry):
        self.registry = registry
        
    async def route_query(self, query: str) -> Optional[str]:
        """Suggest best recipe for user query"""
        # Option 1: Keyword matching
        # Option 2: Use existing routing runner
        # Option 3: Simple LLM call to classify
```

#### Integration with Orchestrator:
- Orchestrator's planner phase can call the router
- Router suggests which recipe tools to use
- Orchestrator executes suggested recipes as workers

## Implementation Priority

### Minimal Viable Implementation (4-5 hours):
1. ✅ RecipeTool wrapper class
2. ✅ Basic tool registry
3. ✅ Simple API endpoints
4. ✅ Basic testing

### Enhanced Implementation (+3-4 hours):
5. ⏱️ LangChain integration
6. ⏱️ Smart routing/classification
7. ⏱️ Recipe composition (recipes calling other recipes)
8. ⏱️ Conversation memory between calls

## Key Design Decisions

### What Changes:
- New thin wrapper layer for tool abstraction
- New API endpoints for tool discovery/execution
- Optional LangChain integration

### What Doesn't Change:
- All existing recipes remain unchanged
- Current runner architecture preserved
- API backwards compatibility maintained
- Frontend continues working as-is

## Benefits

1. **Dynamic Flexibility**: Orchestrator can select recipes based on user needs
2. **Composability**: Recipes can be combined in workflows
3. **Extensibility**: New recipes automatically become available as tools
4. **No Breaking Changes**: Current system continues working
5. **LangChain Ready**: Easy path to advanced agent capabilities

## Example Usage

### Native API:
```python
# List available tools
GET /api/tools
Response: [
    {
        "id": "multi_agent_debate",
        "name": "Multi-Agent Debate",
        "description": "Optimist vs Skeptic debate pattern",
        "inputs": [...]
    },
    {
        "id": "mind_mapping",
        "name": "Mind Mapping",
        "description": "Parallel branching exploration",
        "inputs": [...]
    }
]

# Execute a recipe as a tool
POST /api/tools/mind_mapping/execute
Body: {
    "topic": "Innovation in healthcare",
    "user_id": "demo-user"
}
```

### LangChain Agent:
```python
agent = create_recipe_agent(tool_registry)
result = await agent.run("Help me brainstorm ideas for healthcare innovation")
# Agent automatically selects and runs mind_mapping recipe
```

### Orchestrator Integration:
```python
# In orchestrator planner phase
suggested_tools = await recipe_router.route_query(user_input)
# Planner includes suggested tools in worker allocation
```

## Next Steps

1. **Start with Phase 1**: Create basic tool wrapper
2. **Choose integration approach**: Native API vs LangChain
3. **Implement incrementally**: Each phase provides value
4. **Test with existing recipes**: Ensure compatibility
5. **Document tool schemas**: For easy client integration

## Estimated Timeline

- **Day 1**: Tool wrapper and registry (3-4 hours)
- **Day 2**: API integration or LangChain setup (2-3 hours)
- **Day 3**: Routing and testing (2-3 hours)
- **Total**: 7-10 hours for full implementation

This approach maximizes reuse of existing code while adding powerful new capabilities for dynamic recipe selection and composition.