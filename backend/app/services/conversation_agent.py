"""
Conversational Agent for Recipe Selection and Execution
Composable design: supports both native OpenAI and LangChain via settings.use_langchain
Follows existing patterns: Pydantic models, async/await, settings-based configuration
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from openai import AsyncOpenAI
from app.services.recipe_tools import RecipeToolRegistry
from app.config import settings
import json


# Pydantic models for type safety
class AgentMessage(BaseModel):
    """Single message in conversation"""
    role: str  # "system", "user", "assistant", "tool"
    content: Optional[str] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None
    tool_call_id: Optional[str] = None


class AgentResponse(BaseModel):
    """Response from agent.chat()"""
    message: str
    tool_calls: Optional[List[Dict[str, Any]]] = None
    tool_results: Optional[Dict[str, Any]] = None
    conversation_history: List[Dict[str, str]]


class ConversationAgent:
    """
    OpenAI Functions Agent that selects and executes recipes conversationally.
    Composable: Can use either native OpenAI or LangChain based on settings.use_langchain.
    """

    def __init__(self, tool_registry: RecipeToolRegistry):
        self.tool_registry = tool_registry
        self.use_langchain = settings.use_langchain

        # Initialize OpenAI client (used in both modes)
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model

        # System prompt for agent behavior
        self.base_system_prompt = """You are a sophisticated brainstorming assistant with access to multiple ideation recipes.

Your role:
1. Understand the user's brainstorming goal through natural conversation
2. Select the most appropriate recipe from your available tools
3. Gather any missing required parameters conversationally
4. Execute the recipe and present results clearly
5. Engage in follow-up discussion about the results

Available recipes and when to use them:
- multi_agent_debate: For exploring problems from multiple perspectives (optimist, skeptic, mediator debate). Use when you need balanced, evidence-based analysis from different angles.
- mind_mapping: For comprehensive exploration of a topic across multiple dimensions (core concepts, applications, challenges, connections). Use for broad topic exploration.
- random_word: For creative lateral thinking using random associations. Use when you need to break out of conventional thinking patterns.
- reverse_brainstorming: For problem-solving by inverting the challenge (identify ways to make it worse, then flip them). Use for creative problem-solving.
- rapid_ideation: For high-volume idea generation with filtering and clustering. Use when you need many ideas quickly, then narrow down to the best.

IMPORTANT - Tool Usage Guidelines:
- ALWAYS use tools when the user explicitly mentions them (e.g., "mindmap this", "use reverse brainstorming", "generate ideas")
- PREFER using tools over just describing what they would do - execute them!
- When the user asks for visualization or structured output, USE THE TOOL rather than manually creating text-based versions
- If you have enough information to call a tool, DO IT - don't ask unnecessary follow-up questions
- Only discuss results conversationally AFTER you've executed the tool and shown the results
- Be proactive: if the conversation naturally leads to a brainstorming need, suggest AND execute a tool

Conversational Guidelines:
- Ask clarifying questions ONLY if truly needed (missing required parameters)
- Be conversational and natural - don't just fill forms
- Explain which recipe you're using and why (briefly)
- Present results clearly and offer to elaborate or explore further
- Respect user preferences from their profile (if provided)

Post-Tool Response Guidelines (CRITICAL):
- After executing a tool, provide a BRIEF 1-2 sentence introduction/context
- DO NOT describe the details shown in the visualization - it speaks for itself
- DO NOT list out or summarize the content that's in the visual output
- Focus on: why this technique was chosen, how to interact with the visualization, or what insights to look for
- Offer to explore specific aspects further or answer questions about the results
- Keep it concise and complementary to the visual output

Examples of GOOD responses after tool execution:
✅ "I've created a mind map exploring your topic across multiple dimensions. Click any node to expand/collapse details. What aspect would you like to dive deeper into?"
✅ "Here are 5 prioritized solutions using reverse brainstorming. Each includes priority scores and implementation steps. Should we explore any of these in more detail?"
✅ "I've generated several concepts using rapid ideation. The visualization shows developed ideas with effort estimates. Which concept interests you most?"

Examples of BAD responses (avoid these):
❌ "Here's a mind map with Core Concepts including Data Management which covers data collection and processing..." [repeating visualization content]
❌ "The results show: 1. Idea A with description X, 2. Idea B with description Y..." [listing what's already visible]
❌ Writing long paragraphs describing each element shown in the visualization
"""

    async def chat(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        user_id: Optional[str] = None,
        profile_context: Optional[str] = None
    ) -> AgentResponse:
        """
        Process a user message and return response with optional tool execution.

        Args:
            message: User's message
            conversation_history: List of prior messages (dicts with role/content)
            user_id: Optional user ID for profile injection into tool calls
            profile_context: Optional profile context to add to system prompt

        Returns:
            AgentResponse with message, tool calls, results, and updated history
        """
        # Build system prompt with optional profile context
        system_prompt = self.base_system_prompt
        if profile_context:
            system_prompt += f"\n\nUser Profile Context:\n{profile_context}"

        # Route to appropriate implementation
        if self.use_langchain:
            return await self._chat_with_langchain(
                message, conversation_history, user_id, system_prompt
            )
        else:
            return await self._chat_with_native_openai(
                message, conversation_history, user_id, system_prompt
            )

    async def _chat_with_native_openai(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        user_id: Optional[str],
        system_prompt: str
    ) -> AgentResponse:
        """
        Native OpenAI implementation using function calling.
        This is the default and recommended implementation.
        """
        # Build messages array
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(conversation_history)
        messages.append({"role": "user", "content": message})

        # Get available tools
        tools = self.tool_registry.list_tool_schemas()

        # First LLM call: Agent decides what to do
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=tools if tools else None,
            tool_choice="auto"  # Agent decides whether to call tools
        )

        assistant_message = response.choices[0].message

        # Check if agent wants to call tools
        if assistant_message.tool_calls:
            # Execute tool calls
            tool_results = []
            tool_calls_info = []

            for tool_call in assistant_message.tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)

                # Execute the recipe
                try:
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

                    tool_calls_info.append({
                        "function_name": function_name,
                        "arguments": function_args
                    })

                    # Add tool call and result to messages for next LLM call
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

                except Exception as e:
                    # Handle tool execution errors gracefully
                    error_message = f"Error executing {function_name}: {str(e)}"
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps({"error": error_message})
                    })

            # Second LLM call: Agent interprets and presents results
            final_response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages
            )

            final_message = final_response.choices[0].message.content

            # Update conversation history (simplified format for storage)
            conversation_history.append({"role": "user", "content": message})
            conversation_history.append({"role": "assistant", "content": final_message})

            return AgentResponse(
                message=final_message,
                tool_calls=tool_calls_info,
                tool_results=tool_results[0]["result"] if tool_results else None,
                conversation_history=conversation_history
            )
        else:
            # No tool call - just conversation
            response_text = assistant_message.content

            conversation_history.append({"role": "user", "content": message})
            conversation_history.append({"role": "assistant", "content": response_text})

            return AgentResponse(
                message=response_text,
                tool_calls=None,
                tool_results=None,
                conversation_history=conversation_history
            )

    async def _chat_with_langchain(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        user_id: Optional[str],
        system_prompt: str
    ) -> AgentResponse:
        """
        LangChain implementation (for future use).
        Currently raises NotImplementedError - can be implemented when needed.

        This would use LangChain's agent framework with tool integration.
        Benefits: Built-in memory management, agent reasoning, tool composition.
        """
        raise NotImplementedError(
            "LangChain agent implementation not yet available. "
            "Set USE_LANGCHAIN=false in .env to use native OpenAI implementation."
        )

        # Future implementation would look like:
        # from langchain.agents import AgentExecutor, create_openai_functions_agent
        # from langchain.tools import StructuredTool
        # ...


class ConversationSessionManager:
    """
    Manages conversation histories in memory.
    Simple dict-based storage for MVP. Can be replaced with Redis/DB later.
    """

    def __init__(self):
        self._sessions: Dict[str, List[Dict[str, str]]] = {}

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        """Get conversation history for a session"""
        return self._sessions.get(session_id, [])

    def save_history(self, session_id: str, history: List[Dict[str, str]]):
        """Save conversation history for a session"""
        self._sessions[session_id] = history

    def clear_session(self, session_id: str):
        """Clear conversation history for a session"""
        if session_id in self._sessions:
            del self._sessions[session_id]

    def get_session_count(self) -> int:
        """Get number of active sessions"""
        return len(self._sessions)

    def get_all_session_ids(self) -> List[str]:
        """Get all active session IDs"""
        return list(self._sessions.keys())
