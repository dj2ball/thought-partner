# Complete Recipe System Extension Plan

## 🎯 **Objective**
Transform current single-pattern system (multi-agent iterative debates) into modular architecture supporting 20+ sophisticated ideation recipes with hybrid LangChain/custom runners while maintaining profile-aware personalization.

## 🏗️ **Architecture Overview**

### Current State
- Single iterative runner in `/backend/app/services/runner.py`
- One recipe: multi-agent debate (Optimist→Skeptic→Mediator→Strategic Advisor)
- Profile injection via `profile_to_system()` function
- FastAPI + Next.js with Zustand state management

### Target State
- **6 Runner Types**: SingleShot, Chain (LangChain), Parallel, Iterative (enhanced), Orchestrator, Routing (LangChain)
- **20+ Recipes**: Mind mapping, Crazy 8s, Random word, Lotus blossom, Brainwriting, Storyboarding, Affinity mapping, Starbursting, Morphological matrix, Lightning decision jam, Provocation, Synectics, Futuring backwards, Role storming, Round robin, Routing, Reverse brainstorming, Rapid ideation, World café, Brain netting
- **Enhanced Profile Integration**: Works across all runner types
- **Modular Design**: Data-driven recipes, no hardcoded business logic

## 📋 **Implementation Progress**

### ✅ Phase 1: Backend Runner Architecture (COMPLETED)

#### ✅ 1.1 Base Runner Interface (COMPLETED)
- ✅ Created `/backend/app/services/base_runner.py`
- ✅ Abstract base class with profile injection
- ✅ Unified system prompt building with user preferences
- ✅ Safe template replacement for all runners

#### ✅ 1.2 Six Runner Types (COMPLETED)

**✅ SingleShotRunner** (`/backend/app/services/runners/single_shot.py`)
- ✅ Direct LLM calls with profile injection
- ✅ JSON schema validation support
- ✅ For simple generation tasks

**✅ ChainRunner** (`/backend/app/services/runners/chain.py`) 
- ✅ Sequential steps with LangChain integration
- ✅ Cumulative context building
- ✅ Custom output parsers with schema validation

**✅ ParallelRunner** (`/backend/app/services/runners/parallel.py`)
- ✅ Branching mode (different prompts in parallel)
- ✅ Voting mode (same prompt, temperature variance)
- ✅ Synthesis step for consolidating results

**✅ IterativeRunner** (`/backend/app/services/runners/iterative.py`)
- ✅ Enhanced version of existing multi-agent system
- ✅ Conditional step execution
- ✅ Exit conditions and state management
- ✅ Final synthesis integration

**✅ OrchestratorRunner** (`/backend/app/services/runners/orchestrator.py`)
- ✅ Planner→Workers→Synthesizer pattern
- ✅ Dynamic worker allocation
- ✅ Parallel worker execution

**✅ RoutingRunner** (`/backend/app/services/runners/routing.py`)
- ✅ Classification then specialized processing
- ✅ Custom router implementation
- ✅ Multi-step route execution support
#### ✅ 1.3 RunnerFactory Implementation (COMPLETED)
- ✅ Created `/backend/app/services/runner_factory.py`
- ✅ Automatic runner selection based on recipe configuration
- ✅ Recipe validation and compatibility checking
- ✅ Backward compatibility with legacy `run_mode` field
- ✅ Factory pattern with error handling

#### ✅ 1.4 Unified Runner Service (COMPLETED)
- ✅ Created `/backend/app/services/unified_runner.py`
- ✅ Single entry point for all recipe execution
- ✅ Profile-aware personalization across all runners
- ✅ Backward compatibility functions maintained

#### ✅ 1.5 API Integration (COMPLETED)
- ✅ Updated `/backend/app/routers/run.py` with new unified runner
- ✅ Added `/run/runner-info/{recipe_id}` endpoint for debugging
- ✅ Graceful fallback to legacy runners if needed
- ✅ Maintained existing API contract

### ✅ Phase 2: Enhanced Data Models (COMPLETED)

#### ✅ 2.1 Extended Recipe Schema (COMPLETED)
- ✅ Enhanced `Recipe` model with `WorkflowConfig` union type
- ✅ Added `InputDefinition` for dynamic form generation
- ✅ Created `RecipeMeta` for complexity and time estimates  
- ✅ Implemented all workflow config types:
  - ✅ `ChainConfig` for sequential steps
  - ✅ `ParallelConfig` for branching/voting patterns
  - ✅ `IterativeConfig` enhanced with exit conditions
  - ✅ `OrchestratorConfig` for planner-workers-synthesizer
  - ✅ `RouterConfig` for classification routing
- ✅ Backward compatibility with legacy fields maintained

#### ✅ 2.2 Profile Integration Enhancement (COMPLETED)
- ✅ Profile injection works across all runner types via `BaseRunner`
- ✅ Cognitive preference mapping preserved from existing system
- ✅ Final synthesis layer architecture maintained across all patterns
- ✅ Anti-sycophancy guardrails integrated into base runner

### ✅ Phase 3: First Recipe Implementation (COMPLETED)

#### ✅ 3.1 Mind Mapping Recipe (COMPLETED)
- ✅ **Mind Mapping** (parallel/branching) - Successfully implemented and tested
  - ✅ 4 parallel branches: Core concepts, Practical applications, Challenges & opportunities, Connections & relationships
  - ✅ Synthesis step for unified mind map structure
  - ✅ Enhanced input definitions with examples and validation
  - ✅ Recipe metadata with complexity and time estimates

#### ✅ 3.2 Recipe Schema Validation (COMPLETED)
- ✅ JSON schema validation for all structured outputs
- ✅ Input validation and sanitization in all runners
- ✅ Error handling for malformed recipes in factory

#### ✅ 3.3 Profile Integration Testing (COMPLETED)
- ✅ Validated both existing `multi_agent_debate` (iterative) and new `mind_mapping` (parallel) recipes
- ✅ Profile preferences flow correctly through new runner architecture
- ✅ Anti-sycophancy guardrails maintained across patterns

---

## 🎯 **PHASE 1 COMPLETE - READY FOR NEXT PHASES**

### ✅ **Successfully Completed (Phase 1)**
- **Complete modular runner architecture** with 6 runner types
- **BaseRunner interface** with profile injection and safe templating
- **RunnerFactory pattern** for automatic runner selection
- **Enhanced data models** supporting all workflow types
- **Unified runner service** with backward compatibility
- **API integration** with graceful fallback
- **First new recipe** (Mind Mapping) successfully implemented
- **Full validation** of architecture with existing and new recipes

### 🚀 **Architecture Validated**
- ✅ Existing `multi_agent_debate` → Iterative runner (backward compatible)
- ✅ New `mind_mapping` → Parallel runner (new functionality)
- ✅ Profile-aware personalization works across all runner types
- ✅ Anti-sycophancy guardrails preserved
- ✅ Final synthesis architecture maintained
- ✅ Schema validation enforced for all outputs

---

## 📋 **REMAINING PHASES - READY TO IMPLEMENT**

### ✅ Phase 4: Frontend Enhancements (COMPLETED)

#### ✅ 4.1 Dynamic Input Forms
```typescript
// ✅ /frontend/components/DynamicInputForm.tsx - IMPLEMENTED
interface InputDefinition {
  name: string;
  prompt: string;
  type: 'text' | 'integer' | 'array' | 'boolean';
  required: boolean;
  default?: any;
  range?: [number, number];
  examples?: string[];
  multiline?: boolean;
}
```

#### ✅ 4.2 Enhanced RecipeDrawer
- ✅ Add pattern type indicators (parallel, iterative, etc.)
- ✅ Show complexity levels (beginner, intermediate, advanced)
- ✅ Display time estimates
- ✅ Show "works well with" suggestions
- ✅ Filter by pattern type or complexity

#### ✅ 4.3 Advanced Pattern Rendering
- ✅ 6 specialized renderers for different output types:
  - **TimelineRenderer**: Sequential/temporal workflows
  - **MatrixRenderer**: Dimensional analysis outputs
  - **ClusterRenderer**: Grouped/categorized outputs
  - **GridRenderer**: Rapid concept displays
  - **TreeRenderer**: Recursive/hierarchical patterns
  - **PersonaRenderer**: Role-based perspectives
- ✅ Smart routing logic (recipe name → data structure → pattern fallback)
- ✅ Preserve existing markdown rendering for debates

### 🚀 Phase 5: Recipe Integration (IN PROGRESS)

#### ✅ 5.1 First Recipe Added: Random Word Association (COMPLETED)

**Recipe**: Random Word Catalyst (chain pattern, 3 steps)
- ✅ Added to `brainstorm_recipes.json` with proper chain workflow structure
- ✅ Fixed ChainRunner implementation issues
- ✅ Enhanced GridRenderer for `developed_concepts` display
- ✅ End-to-end tested and working

**Implementation Details**:
```json
{
  "workflow": {
    "type": "chain",
    "chain": {
      "steps": [
        { "id": "analyze_word", ... },
        { "id": "find_connections", ... },
        { "id": "develop_concepts", ... }
      ]
    }
  }
}
```

**Key Debugging & Fixes**:
1. **ChainRunner Architecture Update**:
   - Original: Used LangChain's PromptTemplate (failed with literal JSON in prompts)
   - Fixed: Dual-mode support - Native AsyncOpenAI (default) + LangChain stub (optional)
   - Result: Consistent with other runners, handles JSON schemas properly

2. **ChainRunner Implementation (`/backend/app/services/runners/chain.py`)**:
   ```python
   async def run(self, recipe, inputs):
       if settings.use_langchain:
           return await self._run_with_langchain(recipe, inputs)  # Stub for future
       else:
           return await self._run_native(recipe, inputs)  # Working implementation
   ```
   - Uses AsyncOpenAI directly (like other runners)
   - Supports JSON schema validation
   - Passes context between steps: `step.{step_id}.output` → next step
   - Profile injection works correctly

3. **Frontend GridRenderer Enhancement (`/frontend/components/PatternRenderer.tsx`)**:
   - Added `developed_concepts` to detection logic
   - Enhanced concept cards with all fields:
     - 🎨 Inspired by (borrowed_from)
     - 💡 Why compelling
     - 🔧 Implementation
     - ⚠️ Challenges
   - Automatic detection via data structure (no manual routing needed)

**Recipe Flow**:
```
User Input: target_domain="mobile apps", random_word="lighthouse", n_connections=5
     ↓
Step 1 (analyze_word): Generate 5 properties of "lighthouse"
     ↓
Step 2 (find_connections): Link each property to mobile apps (5 rough ideas)
     ↓
Step 3 (develop_concepts): Select TOP 3 strongest + fully develop them
     ↓
Output: 3 developed concepts with title, borrowed_from, why_compelling, implementation, challenges
```

**Architecture Validation**:
- ✅ RunnerFactory routes correctly to ChainRunner
- ✅ Native OpenAI mode works (default)
- ✅ LangChain option preserved (stub with clear TODO)
- ✅ Profile injection applied via BaseRunner
- ✅ JSON schema enforcement works
- ✅ Context passing between chain steps works
- ✅ Frontend auto-detects and renders properly

#### 🔄 5.2 Remaining Recipes (4 more to add)

**Next Up** (all using working runners):
- **Reverse Brainstorming** (chain) - 3 steps: sabotage → invert → prioritize
- **Rapid Ideation** (chain) - 3 steps: generate flood → filter → format
- **Crazy 8s** (parallel/voting) - 8 parallel variations + ranking
- **Affinity Mapping** (routing) - cluster → refine → synthesize

#### 5.3 Recipe Chaining Support (Future Phase)
- Enable output from one recipe to feed into another
- Create recipe combination suggestions
- Implement workflow templates for common recipe sequences

### Phase 6: Quality & Testing (Week 3)

#### 6.1 Anthropic Best Practices Implementation
- **Schema-enforced outputs** for all structured data
- **Evaluator-optimizer patterns** where applicable
- **Progressive disclosure** (basic inputs required, advanced optional)
- **Transparency & debuggability** (show intermediate steps)
- **Anti-sycophancy guardrails** across all patterns

#### 6.2 Comprehensive Testing
- Unit tests for all runners
- Integration tests for recipe execution
- Profile integration validation
- Frontend input/output testing
- Error handling and edge case testing

## 🔧 **Technical Specifications**

### LangChain Integration Status
- **ChainRunner**: Dual-mode support
  - Native AsyncOpenAI (default, `USE_LANGCHAIN=false`) - ✅ Working
  - LangChain mode (optional, `USE_LANGCHAIN=true`) - ⏳ Stub (future implementation)
  - Issue: LangChain's PromptTemplate can't handle literal JSON in prompts
- **RoutingRunner**: Native implementation (no LangChain dependency)
- **All Other Runners**: Native AsyncOpenAI (consistent architecture)

### Profile Integration Strategy
- All runners inherit profile injection capability
- Cognitive preferences mapped to appropriate system prompts
- Final synthesis layer preserved across all patterns
- User constraints and style notes respected

### Data Flow Architecture
```
User Input → RunnerFactory → SpecificRunner → LLM/LangChain → Profile-Aware Processing → Structured Output → Frontend Rendering
```

### Backward Compatibility
- Existing multi-agent debate system becomes IterativeRunner
- Current API endpoints remain unchanged
- Frontend gracefully handles both old and new recipe formats

## 📊 **Success Metrics**
- ✅ **Modular backend architecture** - 6 runner types implemented
- ✅ **Profile-aware personalization** - Works across all patterns
- ✅ **No hardcoded business logic** - Pure data-driven recipes
- ✅ **Frontend dynamically handles all input types** - Dynamic forms implemented
- ✅ **Frontend dynamically handles all output formats** - 6 pattern renderers implemented
- 🚀 **All 20+ recipes successfully integrated** - Ready for implementation
- 🔮 **Recipe chaining and combination workflows** - Future phase
- ✅ **Performance maintains sub-2-minute execution times** - Validated

## 🧩 **Recipe Inventory**

### Phase 1 Implementation (5 recipes)
1. **Mind Mapping** (parallel/sectioning) - Multi-dimensional exploration
2. **Random Word** (chain) - Lateral thinking catalyst
3. **Reverse Brainstorming** (chain) - Problem inversion
4. **Lotus Blossom** (iterative) - Recursive expansion
5. **Starbursting** (orchestrator) - Multi-angle questioning

### Phase 2 Implementation (15 remaining recipes)
6. **Crazy 8s** (parallel/voting) - Rapid concept generation
7. **Brainwriting 6-3-5** (iterative) - Collaborative idea building
8. **Storyboarding** (evaluator-optimizer) - Sequential process mapping
9. **Affinity Mapping** (routing) - Idea clustering
10. **Morphological Matrix** (orchestrator) - Systematic combination analysis
11. **Lightning Decision Jam** (chain) - Fast problem solving
12. **Provocation (Po)** (chain) - Absurd stimulus thinking
13. **Synectics** (chain) - Metaphor forcing
14. **Futuring Backwards** (chain) - Temporal reasoning
15. **Role Storming** (chain) - Persona injection
16. **Round Robin** (chain/cumulative) - Sequential hand-off
17. **Routing** (routing) - General purpose classification
18. **Rapid Ideation** (chain) - High volume generation
19. **World Café** (iterative) - Virtual dialogue simulation
20. **Brain Netting** (iterative) - Asynchronous accumulation

This plan transforms your current sophisticated single-pattern system into a comprehensive, modular ideation platform while preserving all existing innovations (profile-aware AI, anti-sycophancy, beautiful UX) and maintaining clean separation of concerns.