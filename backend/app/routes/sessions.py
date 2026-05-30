from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from app.models.message import MessageCreate
from app.models.session import SessionCreate
from app.services.gemini_service import GeminiService
from app.services.firestore_service import FirestoreService
from app.services.conversation_coordination_service import ConversationCoordinationService, CoordinationAnalyzeRequest
from app.utils.security import get_current_user_id
from app.utils.timestamps import utc_now_iso

router = APIRouter()


def get_store(request: Request) -> FirestoreService:
    return request.app.state.store


def get_ai(request: Request) -> GeminiService:
    return request.app.state.ai


def get_coordination(request: Request) -> ConversationCoordinationService:
    return request.app.state.conversation_coordination


@router.post("/api/sessions")
async def create_session(payload: SessionCreate, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if current_user_id:
        payload.userId = current_user_id
    return await get_store(request).create_session(payload)


@router.get("/api/sessions/{session_id}")
async def get_session(session_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    session = await get_store(request).get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user_id and session.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Session does not belong to this user")
    messages = await get_store(request).get_messages(session_id)
    return {"session": session, "messages": messages}


@router.get("/api/users/{user_id}/sessions")
async def get_user_sessions(user_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    resolved_user_id = current_user_id or user_id
    return await get_store(request).list_user_sessions(resolved_user_id)


@router.post("/api/sessions/{session_id}/message")
async def send_message(session_id: str, payload: MessageCreate, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    store = get_store(request)
    session = await store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user_id and session.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Session does not belong to this user")
    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Session already completed")
    user_message = await store.add_message(session_id, "user", payload.content)
    history = await store.get_messages(session_id)
    coordination_state = await get_coordination(request).analyze(
        CoordinationAnalyzeRequest(
            transcript=payload.content,
            interimTranscript=payload.interimTranscript,
            speechDurationMs=payload.speechDurationMs,
            silenceMs=payload.silenceMs,
            wordTimings=payload.wordTimings or [],
            sessionId=session_id,
            userId=session.userId,
        )
    )
    coordination_context = get_coordination(request).prompt_context(coordination_state)
    ai_content = await get_ai(request).generate_roleplay_response(session, history, coordination_context)
    ai_message = await store.add_message(session_id, "ai", ai_content)
    session.turnCount += 1
    await store.update_session(session)
    return {"userMessage": user_message, "aiMessage": ai_message, "turnCount": session.turnCount}


@router.post("/api/sessions/{session_id}/end")
async def end_session(session_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    store = get_store(request)
    session = await store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user_id and session.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Session does not belong to this user")
    session.status = "completed"
    session.completedAt = utc_now_iso()
    return await store.update_session(session)
