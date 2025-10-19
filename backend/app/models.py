from pydantic import BaseModel, Field
from typing import Any, Dict, Optional, List, Union

# Enhanced input definition for dynamic forms
class InputDefinition(BaseModel):
    name: str
    prompt: str
    type: str = "text"  # text, integer, array, boolean
    required: bool = True
    default: Optional[Any] = None
    range: Optional[List[int]] = None  # For integers
    examples: Optional[List[str]] = None
    multiline: Optional[bool] = False
    generator: Optional[str] = None  # For auto-generated values

# Recipe metadata
class RecipeMeta(BaseModel):
    complexity: Optional[str] = None  # beginner, intermediate, advanced
    time_estimate: Optional[str] = None
    tags: List[str] = []
    works_well_with: List[str] = []

# Workflow configurations for different runner types
class ChainConfig(BaseModel):
    steps: List[Dict[str, Any]]
    temperature: Optional[float] = 0.7

class ParallelConfig(BaseModel):
    mode: str = "voting"  # voting, branching
    branches: Optional[List[Dict[str, Any]]] = None
    votes: Optional[int] = 3
    temperature_range: Optional[List[float]] = [0.3, 0.9]
    prompt: Optional[str] = None
    response_schema: Optional[Dict[str, Any]] = None
    synthesis: Optional[Dict[str, Any]] = None

class OrchestratorConfig(BaseModel):
    planner: Dict[str, Any]
    workers: Dict[str, Any]
    synthesizer: Dict[str, Any]

class RouterConfig(BaseModel):
    classifier: Dict[str, Any]
    routes: List[Dict[str, Any]]
    default_route: Optional[Dict[str, Any]] = None

class IterativeConfig(BaseModel):
    loop_prompt_template: Optional[str] = None
    initial_state: Optional[Dict[str, Any]] = None
    step_response_schema: Optional[Dict[str, Any]] = None
    default_loops: int = 4
    max_loops: int = 12
    substeps: Optional[List[Dict[str, Any]]] = None
    language_guardrails: Optional[str] = None
    final_synthesis: Optional[Dict[str, Any]] = None
    exit_conditions: Optional[List[Dict[str, Any]]] = None

# Union of all workflow configs
class WorkflowConfig(BaseModel):
    type: str  # single_shot, chain, parallel, iterative, orchestrator, routing
    chain: Optional[ChainConfig] = None
    parallel: Optional[ParallelConfig] = None
    iterative: Optional[IterativeConfig] = None
    orchestrator: Optional[OrchestratorConfig] = None
    router: Optional[RouterConfig] = None

class Recipe(BaseModel):
    id: str
    name: str
    description: str
    inputs: Union[List[str], List[InputDefinition]]  # Support both legacy and new format
    user_prompt_template: str
    system_prompt: Optional[str] = None
    response_format: Optional[Dict[str, Any]] = None
    run_mode: str = "one-shot"  # Legacy field for backward compatibility
    workflow: Optional[WorkflowConfig] = None  # New workflow configuration
    iterative: Optional[IterativeConfig] = None  # Legacy field for backward compatibility
    meta: Optional[RecipeMeta] = None
    methodology: Optional[Dict[str, Any]] = None  # Educational context for users
    notes: Optional[str] = None
    ui_preferences: Optional[Dict[str, Any]] = None
    output_format: Optional[Dict[str, Any]] = None

class RunRequest(BaseModel):
    recipe_id: str
    params: Dict[str, Any] = Field(default_factory=dict)
    mode: str = "auto"  # "one-shot" | "iterative" | "auto"
    loops: Optional[int] = None

class RunResponse(BaseModel):
    recipe_id: str
    mode: str
    output: Any
    meta: Dict[str, Any] = Field(default_factory=dict)