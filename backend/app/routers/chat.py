"""
Chat Router for Conversational Recipe Agent
Follows existing patterns: FastAPI router, Pydantic models, async endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from app.services.conversation_agent import ConversationAgent, ConversationSessionManager
from app.services.recipe_tools import RecipeToolRegistry
from app.recipes import list_recipes
from app.models_user import UserProfile
from app.services.runner import profile_to_system  # Reuse existing profile conversion
import uuid


router = APIRouter()


# Pydantic models for type-safe API
class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str = Field(..., description="User's message", min_length=1)
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    user_id: Optional[str] = Field(None, description="User ID for profile injection")


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    session_id: str = Field(..., description="Session ID (new or existing)")
    message: str = Field(..., description="Agent's response message")
    tool_calls: Optional[List[Dict[str, Any]]] = Field(None, description="Tools called (if any)")
    tool_results: Optional[Dict[str, Any]] = Field(None, description="Tool execution results (if any)")


class SessionInfo(BaseModel):
    """Information about a conversation session"""
    session_id: str
    message_count: int


class SessionsResponse(BaseModel):
    """Response with all active sessions"""
    total_sessions: int
    sessions: List[SessionInfo]


# Initialize singletons (follows pattern from other routers)
# These are created once when the module loads
try:
    recipes = list_recipes()
    tool_registry = RecipeToolRegistry(recipes)
    agent = ConversationAgent(tool_registry)
    session_manager = ConversationSessionManager()
    print(f"✅ Chat router initialized with {len(recipes)} recipe tools")
except Exception as e:
    print(f"❌ Error initializing chat router: {e}")
    # Create empty instances to avoid import errors
    tool_registry = None
    agent = None
    session_manager = None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Conversational endpoint for recipe agent.

    The agent will:
    1. Understand user intent
    2. Select appropriate recipe tool
    3. Gather missing parameters conversationally
    4. Execute recipe and present results
    5. Handle follow-up questions

    Example:
        POST /chat
        {
            "message": "I need to brainstorm mobile app ideas",
            "user_id": "demo-user"
        }
    """
    if not agent or not session_manager:
        raise HTTPException(
            status_code=500,
            detail="Chat service not initialized. Check server logs."
        )

    # Get or create session
    session_id = request.session_id or str(uuid.uuid4())
    history = session_manager.get_history(session_id)

    # Get profile context if user_id provided (reuse existing function)
    profile_context = None
    if request.user_id:
        try:
            from app.services.runner import load_profile
            profile = load_profile(request.user_id)
            if profile:
                profile_context = profile_to_system(profile)
        except Exception as e:
            print(f"Warning: Could not load profile for {request.user_id}: {e}")

    try:
        # Process message through agent
        result = await agent.chat(
            message=request.message,
            conversation_history=history,
            user_id=request.user_id,
            profile_context=profile_context
        )

        # Save updated history
        session_manager.save_history(session_id, result.conversation_history)

        return ChatResponse(
            session_id=session_id,
            message=result.message,
            tool_calls=result.tool_calls,
            tool_results=result.tool_results
        )

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat: {str(e)}"
        )


@router.delete("/chat/{session_id}")
async def clear_session(session_id: str):
    """
    Clear conversation history for a session.
    Useful for "New Conversation" button in UI.

    Example:
        DELETE /chat/abc-123-def-456
    """
    if not session_manager:
        raise HTTPException(
            status_code=500,
            detail="Chat service not initialized"
        )

    session_manager.clear_session(session_id)
    return {"status": "cleared", "session_id": session_id}


@router.get("/chat/sessions", response_model=SessionsResponse)
async def list_sessions():
    """
    List all active conversation sessions.
    Useful for debugging and monitoring.

    Example:
        GET /chat/sessions
    """
    if not session_manager:
        raise HTTPException(
            status_code=500,
            detail="Chat service not initialized"
        )

    session_ids = session_manager.get_all_session_ids()
    sessions = []

    for sid in session_ids:
        history = session_manager.get_history(sid)
        sessions.append(SessionInfo(
            session_id=sid,
            message_count=len(history)
        ))

    return SessionsResponse(
        total_sessions=session_manager.get_session_count(),
        sessions=sessions
    )


@router.get("/chat/tools")
async def list_tools():
    """
    List all available recipe tools that the agent can use.
    Useful for debugging and documentation.

    Example:
        GET /chat/tools
    """
    if not tool_registry:
        raise HTTPException(
            status_code=500,
            detail="Chat service not initialized"
        )

    return {
        "total_tools": len(tool_registry.get_tool_names()),
        "tools": tool_registry.get_registry_info()["tool_details"]
    }
