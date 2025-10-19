# Recipe-as-Tools Implementation Plan

## Overview
Transform Thought Partner from form-based recipe selection to **conversational AI agent** that intelligently selects and executes recipes through natural dialogue. Users interact conversationally to provide inputs and follow up on results.

## Strategic Decision: Full Replacement

### UI Paradigm Shift
- **Remove**: Dropdown recipe selector + static input forms
- **Replace with**: Conversational chat interface with OpenAI Functions Agent
- **Experience**: Natural dialogue → Agent selects recipe → Gathers info conversationally → Executes → Discusses results

### Why Full Replacement?
1. **Simpler UX**: One interaction paradigm vs. two
2. **More Natural**: Users describe intent, agent figures out "how"
3. **Future-proof**: Enables recipe chaining, clarifying questions, adaptive flows
4. **Aligns with AI-first**: Leverage LLM's natural strengths

## Current State Analysis

### What We Have:
1. **Clean Recipe System**: 5+ recipes with defined inputs/outputs in `brainstorm_recipes.json`
2. **Unified Runner**: `run_recipe()` provides single entry point to execute any recipe
3. **Factory Pattern**: RunnerFactory handles all runner type selection
4. **JSON In/Out**: Recipes work with structured JSON inputs/outputs
5. **Async Architecture**: Everything already async-ready
6. **6 Runner Types**: single_shot, iterative, parallel, chain, routing, orchestrator
7. **Existing Chat UI**: ChatThread + Composer components ready to adapt

### Architecture Benefits:
- Recipes self-contained with metadata
- Clear separation between recipe definition and execution
- Profile-aware personalization already built
- Beautiful rendering system for recipe outputs

## Implementation Plan

### Phase 1: Backend Tool Wrapper Layer (2-3 hours)

#### 1. Create `app/services/recipe_tools.py`:
```python
from typing import Dict, Any, List, Optional
from app.models import Recipe
from app.services.unified_runner import run_recipe
import json

class RecipeTool:
    """Wrapper that makes any recipe callable as an OpenAI function tool"""

    def __init__(self, recipe: Recipe):
        self.recipe = recipe
        self.name = recipe.id
        self.description = recipe.description

    async def execute(self, user_id: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Execute recipe with provided parameters"""
        result = await run_recipe(self.recipe, kwargs, user_id)
        return json.loads(result)

    def to_openai_function_schema(self) -> Dict[str, Any]:
        """Generate OpenAI function calling schema from recipe definition"""
        properties = {}
        required = []

        # Parse recipe.inputs (e.g., ["problem", "loops=3"])
        for input_def in self.recipe.inputs:
            if "=" in input_def:
                # Optional with default
                param_name, default_value = input_def.split("=")
                properties[param_name] = {
                    "type": self._infer_type(default_value),
                    "description": f"Optional parameter (default: {default_value})"
                }
            else:
                # Required parameter
                param_name = input_def
                properties[param_name] = {
                    "type": "string",
                    "description": f"Required: {param_name}"
                }
                required.append(param_name)

        # Use InputDefinition if available (richer schema)
        if hasattr(self.recipe, 'input_definitions') and self.recipe.input_definitions:
            for input_def in self.recipe.input_definitions:
                properties[input_def['name']] = {
                    "type": input_def.get('type', 'string'),
                    "description": input_def.get('prompt', ''),
                }
                if input_def.get('required', True):
                    required.append(input_def['name'])

        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    "required": required
                }
            }
        }

    @staticmethod
    def _infer_type(value: str) -> str:
        """Infer JSON schema type from default value string"""
        if value.isdigit():
            return "integer"
        if value.lower() in ("true", "false"):
            return "boolean"
        return "string"


class RecipeToolRegistry:
    """Registry for all available recipe tools"""

    def __init__(self, recipes: List[Recipe]):
        self._tools: Dict[str, RecipeTool] = {}
        for recipe in recipes:
            self._tools[recipe.id] = RecipeTool(recipe)

    def get_tool(self, recipe_id: str) -> Optional[RecipeTool]:
        return self._tools.get(recipe_id)

    def list_tool_schemas(self) -> List[Dict[str, Any]]:
        """Return OpenAI function schemas for all recipes"""
        return [tool.to_openai_function_schema() for tool in self._tools.values()]

    def get_tool_names(self) -> List[str]:
        return list(self._tools.keys())

    async def execute_tool(self, recipe_id: str, user_id: Optional[str], **kwargs) -> Dict[str, Any]:
        """Execute a tool by ID"""
        tool = self.get_tool(recipe_id)
        if not tool:
            raise ValueError(f"Recipe not found: {recipe_id}")
        return await tool.execute(user_id=user_id, **kwargs)
```

### Phase 2: OpenAI Functions Agent (3-4 hours)

#### 1. Create `app/services/conversation_agent.py`:
```python
from typing import Dict, Any, List, Optional
from openai import AsyncOpenAI
from app.services.recipe_tools import RecipeToolRegistry
from app.config import settings
import json

class ConversationAgent:
    """OpenAI Functions Agent that selects and executes recipes conversationally"""

    def __init__(self, tool_registry: RecipeToolRegistry):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.tool_registry = tool_registry
        self.model = settings.openai_model or "gpt-4o"

        # System prompt for agent behavior
        self.system_prompt = """You are a sophisticated brainstorming assistant with access to multiple ideation recipes.

Your role:
1. Understand the user's brainstorming goal through natural conversation
2. Select the most appropriate recipe from your available tools
3. Gather any missing required parameters conversationally
4. Execute the recipe and present results
5. Engage in follow-up discussion about the results

Available recipes and when to use them:
- multi_agent_debate: For exploring problems from multiple perspectives (optimist, skeptic, mediator debate)
- mind_mapping: For comprehensive exploration of a topic across multiple dimensions
- random_word: For creative lateral thinking using random associations
- reverse_brainstorming: For problem-solving by inverting the challenge
- rapid_ideation: For high-volume idea generation with filtering

Guidelines:
- Ask clarifying questions if the user's intent is unclear
- Be conversational and natural - don't just fill forms
- Explain which recipe you're using and why
- Present results clearly and offer to elaborate or explore further
- Respect user preferences from their profile (if provided)
"""

    async def chat(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a user message and return response with tool execution

        Returns:
            {
                "message": "Agent response text",
                "tool_calls": [...],  # Optional: list of tools called
                "tool_results": {...},  # Optional: results from tool execution
                "conversation_history": [...]  # Updated history
            }
        """
        # Build messages array
        messages = [{"role": "system", "content": self.system_prompt}]
        messages.extend(conversation_history)
        messages.append({"role": "user", "content": message})

        # Get available tools
        tools = self.tool_registry.list_tool_schemas()

        # First LLM call: Agent decides what to do
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=tools,
            tool_choice="auto"  # Agent decides whether to call tools
        )

        assistant_message = response.choices[0].message

        # Check if agent wants to call tools
        if assistant_message.tool_calls:
            # Execute tool calls
            tool_results = []
            for tool_call in assistant_message.tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)

                # Execute the recipe
                result = await self.tool_registry.execute_tool(
                    recipe_id=function_name,
                    user_id=user_id,
                    **function_args
                )

                tool_results.append({
                    "tool_call_id": tool_call.id,
                    "function_name": function_name,
                    "result": result
                })

                # Add tool call and result to messages
                messages.append({
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [{
                        "id": tool_call.id,
                        "type": "function",
                        "function": {
                            "name": function_name,
                            "arguments": tool_call.function.arguments
                        }
                    }]
                })

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result)
                })

            # Second LLM call: Agent interprets and presents results
            final_response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages
            )

            final_message = final_response.choices[0].message.content

            # Update conversation history
            conversation_history.append({"role": "user", "content": message})
            conversation_history.append({"role": "assistant", "content": final_message})

            return {
                "message": final_message,
                "tool_calls": [
                    {
                        "function_name": tc["function_name"],
                        "arguments": function_args
                    }
                    for tc in tool_results
                ],
                "tool_results": tool_results[0]["result"] if tool_results else None,
                "conversation_history": conversation_history
            }
        else:
            # No tool call - just conversation
            response_text = assistant_message.content

            conversation_history.append({"role": "user", "content": message})
            conversation_history.append({"role": "assistant", "content": response_text})

            return {
                "message": response_text,
                "conversation_history": conversation_history
            }


# Session storage for conversation histories (in-memory)
class ConversationSessionManager:
    """Manages conversation histories in memory"""

    def __init__(self):
        self._sessions: Dict[str, List[Dict[str, str]]] = {}

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        return self._sessions.get(session_id, [])

    def save_history(self, session_id: str, history: List[Dict[str, str]]):
        self._sessions[session_id] = history

    def clear_session(self, session_id: str):
        if session_id in self._sessions:
            del self._sessions[session_id]
```

### Phase 3: API Integration (1-2 hours)

#### 1. Create `app/routers/chat.py`:
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.conversation_agent import ConversationAgent, ConversationSessionManager
from app.services.recipe_tools import RecipeToolRegistry
from app.recipes import load_recipes
import uuid

router = APIRouter()

# Initialize agent and session manager (singleton-ish for now)
recipes = load_recipes()
tool_registry = RecipeToolRegistry(recipes)
agent = ConversationAgent(tool_registry)
session_manager = ConversationSessionManager()


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: str
    message: str
    tool_calls: Optional[List[Dict]] = None
    tool_results: Optional[Dict] = None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Conversational endpoint for recipe agent
    """
    # Get or create session
    session_id = request.session_id or str(uuid.uuid4())
    history = session_manager.get_history(session_id)

    try:
        # Process message through agent
        result = await agent.chat(
            message=request.message,
            conversation_history=history,
            user_id=request.user_id
        )

        # Save updated history
        session_manager.save_history(session_id, result["conversation_history"])

        return ChatResponse(
            session_id=session_id,
            message=result["message"],
            tool_calls=result.get("tool_calls"),
            tool_results=result.get("tool_results")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/chat/{session_id}")
async def clear_session(session_id: str):
    """Clear conversation history for a session"""
    session_manager.clear_session(session_id)
    return {"status": "cleared"}
```

#### 2. Register router in `main.py`:
```python
from app.routers import chat

app.include_router(chat.router, tags=["chat"])
```

### Phase 4: Frontend Conversational UI (2-3 hours)

#### 1. Update `app/page.tsx` (Main Chat Interface):
```typescript
// Remove RecipeDrawer, remove DynamicInputForm
// Keep: ChatThread, Composer

'use client';

import { useState, useEffect } from 'react';
import ChatThread from '@/components/ChatThread';
import Composer from '@/components/Composer';
import { chatWithAgent } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: any[];
  tool_results?: any;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (message: string) => {
    // Add user message to UI immediately
    const userMessage: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);

    setIsLoading(true);

    try {
      const response = await chatWithAgent({
        message,
        session_id: sessionId,
        user_id: 'demo-user'  // TODO: Get from auth
      });

      // Update session ID
      if (!sessionId) {
        setSessionId(response.session_id);
      }

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message,
        tool_calls: response.tool_calls,
        tool_results: response.tool_results
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-purple-900 text-white p-4">
        <h1 className="text-xl font-bold">💭 Thought Partner</h1>
        <p className="text-sm text-purple-200">
          Conversational AI Brainstorming Assistant
        </p>
      </header>

      <div className="flex-1 overflow-hidden">
        <ChatThread messages={messages} isLoading={isLoading} />
      </div>

      <div className="border-t border-gray-700">
        <Composer onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
```

#### 2. Update `lib/api.ts`:
```typescript
export async function chatWithAgent(request: {
  message: string;
  session_id?: string;
  user_id?: string;
}) {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`Chat failed: ${response.statusText}`);
  }

  return response.json();
}

export async function clearChatSession(sessionId: string) {
  await fetch(`${API_URL}/chat/${sessionId}`, {
    method: 'DELETE'
  });
}
```

#### 3. Update `components/ChatThread.tsx`:
```typescript
// Enhance to show tool calls and recipe results inline

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: Array<{
    function_name: string;
    arguments: any;
  }>;
  tool_results?: any;
}

export default function ChatThread({
  messages,
  isLoading
}: {
  messages: Message[];
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {messages.map((msg, idx) => (
        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-2xl p-4 rounded-lg ${
            msg.role === 'user'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-100'
          }`}>
            {/* User or assistant message */}
            <div className="prose prose-invert">
              {msg.content}
            </div>

            {/* Show tool calls if present */}
            {msg.tool_calls && msg.tool_calls.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="text-sm text-purple-300 mb-2">
                  🔧 Used recipe: <strong>{msg.tool_calls[0].function_name}</strong>
                </div>
              </div>
            )}

            {/* Render recipe results if present */}
            {msg.tool_results && (
              <div className="mt-4">
                <PatternRenderer result={msg.tool_results} />
              </div>
            )}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-800 text-gray-100 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full" />
              <span>Thinking...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 4. Update `components/Composer.tsx`:
```typescript
// Simplify to just text input (no recipe selector needed)

export default function Composer({
  onSend,
  disabled
}: {
  onSend: (message: string) => void;
  disabled?: boolean;
}) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe what you want to brainstorm..."
          disabled={disabled}
          className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition"
        >
          Send
        </button>
      </div>
    </form>
  );
}
```

## Implementation Timeline

### Day 1: Backend Tool Foundation (3-4 hours)
- [ ] Create `recipe_tools.py` with RecipeTool and RecipeToolRegistry
- [ ] Test tool schema generation from all 5 existing recipes
- [ ] Create `conversation_agent.py` with OpenAI Functions Agent
- [ ] Create `ConversationSessionManager` for in-memory history
- [ ] Unit test tool execution

### Day 2: API & Agent Integration (2-3 hours)
- [ ] Create `routers/chat.py` with `/chat` endpoint
- [ ] Register chat router in `main.py`
- [ ] Test agent with curl/Postman
- [ ] Verify tool selection and execution
- [ ] Test multi-turn conversations

### Day 3: Frontend Conversational UI (2-3 hours)
- [ ] Update `app/page.tsx` to remove RecipeDrawer/DynamicInputForm
- [ ] Simplify to ChatThread + Composer only
- [ ] Add `chatWithAgent()` API call in `lib/api.ts`
- [ ] Update ChatThread to show tool calls and results inline
- [ ] Update Composer to simple text input
- [ ] Test end-to-end user flow

### Day 4: Polish & Testing (1-2 hours)
- [ ] Add loading states and error handling
- [ ] Test with all 5 recipes
- [ ] Add "New conversation" button (clear session)
- [ ] Profile integration (pass user profile to agent system prompt)
- [ ] Documentation updates

**Total: 8-12 hours**

## Key Design Decisions

### What Changes:
- **UI Paradigm**: Remove dropdown + forms → Pure conversational chat
- **New Backend**: Tool wrapper layer + OpenAI Functions Agent
- **New API**: `/chat` endpoint for agent interaction
- **Session Management**: In-memory conversation history

### What Doesn't Change:
- **All existing recipes** remain unchanged
- **Current runner architecture** preserved (recipes just wrapped as tools)
- **Profile-aware personalization** maintained (injected into agent system prompt)
- **PatternRenderer** continues working (now renders inline in chat)

### Migration Strategy:
1. **Backend**: Add new agent layer alongside existing `/run` endpoint
2. **Frontend**: Replace main page UI, keep all rendering components
3. **Testing**: Verify each recipe works via agent before removing old UI
4. **Cleanup**: Remove old components after full validation

## Example User Flows

### Flow 1: Simple Recipe Execution
```
User: "I need to brainstorm ideas for a mobile app"

Agent: "I'd be happy to help! I can use the Mind Mapping recipe to explore this
from multiple angles - we'll look at core concepts, practical applications,
challenges, and relationships. What specific aspect of mobile apps are you
focusing on? (e.g., productivity, social, health, etc.)"

User: "AI-powered productivity tools"

Agent: [Calls mind_mapping tool with topic="AI-powered productivity tools"]

Agent: "Here's a comprehensive mind map exploring AI-powered productivity tools:

[PatternRenderer shows the mind map results]

The exploration revealed some interesting directions, especially around
adaptive workflows and intelligent task prioritization. Would you like me to
elaborate on any particular branch?"
```

### Flow 2: Clarifying Questions
```
User: "Help me solve a problem with my team"

Agent: "I can help with that! Can you tell me more about the problem you're
facing? Is it related to collaboration, communication, process, or something else?"

User: "We're struggling with remote collaboration"

Agent: "Got it. I think the Reverse Brainstorming recipe would be perfect here
- we'll identify ways to make the problem worse, then flip them into solutions.
How many different angles would you like to explore? (I typically recommend 5-8)"

User: "Let's do 6"

Agent: [Calls reverse_brainstorming with problem="remote team collaboration" and n_sabotages=6]
```

### Flow 3: Follow-up Discussion
```
[After recipe execution]

User: "Can you tell me more about solution #3?"

Agent: "Absolutely! Solution #3 was about 'Implementing asynchronous standup
rituals.' This came from inverting the sabotage 'Force everyone into endless
synchronous meetings.'

The key insight here is..."

[Agent discusses results without calling new tools]
```

## Profile Integration

### Injecting User Profile into Agent:
```python
# In conversation_agent.py
if user_id:
    profile = await get_user_profile(user_id)
    profile_context = profile_to_system_prompt(profile)
    self.system_prompt += f"\n\n{profile_context}"
```

This ensures the agent respects user preferences:
- Cognitive style (divergent thinking, detail level, etc.)
- Writing preferences (tone, citations, step-by-step)
- Constraints (time limits, output formats)

## Benefits of This Approach

1. **Natural UX**: Users describe intent, agent handles mechanics
2. **Intelligent Selection**: Agent picks best recipe based on context
3. **Conversational Gathering**: Agent asks for missing inputs naturally
4. **Follow-up Support**: Users can discuss results, ask questions
5. **Future-proof**: Easy to add recipe chaining, multi-step workflows
6. **Maintains Quality**: All existing recipe logic preserved
7. **Profile-Aware**: User preferences automatically applied

## Testing Strategy

### Backend Tests:
1. Tool schema generation from recipe definitions
2. Tool execution for each recipe
3. Agent tool selection accuracy
4. Multi-turn conversation history
5. Error handling (invalid params, API failures)

### Frontend Tests:
1. Message sending and display
2. Tool call visualization
3. Recipe result rendering inline
4. Loading states
5. Session persistence

### Integration Tests:
1. End-to-end: user message → agent → tool execution → result display
2. Multi-turn: follow-up questions work correctly
3. Profile injection: preferences respected across conversations

## Migration Checklist

- [ ] Backend tool wrapper implementation
- [ ] OpenAI Functions Agent implementation
- [ ] `/chat` API endpoint
- [ ] Session management (in-memory)
- [ ] Frontend UI updates (remove old, add chat)
- [ ] PatternRenderer integration in ChatThread
- [ ] Profile injection into agent
- [ ] Testing all 5 recipes via agent
- [ ] Error handling and edge cases
- [ ] Documentation updates
- [ ] Remove old components (RecipeDrawer, DynamicInputForm)

## Success Criteria

- ✅ User can describe intent in natural language
- ✅ Agent selects appropriate recipe automatically
- ✅ Agent gathers missing inputs conversationally
- ✅ Recipe executes and results display inline in chat
- ✅ User can ask follow-up questions
- ✅ All 5 recipes work via agent
- ✅ Profile preferences respected
- ✅ Conversation history maintained within session
- ✅ Sub-2-minute execution times maintained

This plan transforms Thought Partner into a true conversational AI assistant while preserving all the sophisticated recipe architecture and personalization already built.
