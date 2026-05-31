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


async def require_age_confirmed(store: FirestoreService, user_id: Optional[str]) -> None:
    if not user_id:
        return
    profile = await store.get_user_profile(user_id)
    if not (profile or {}).get("ageConfirmed", False):
        raise HTTPException(status_code=403, detail="Age confirmation is required before using RehearseAI.")


@router.post("/api/sessions")
async def create_session(payload: SessionCreate, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    await require_age_confirmed(get_store(request), current_user_id)
    if current_user_id:
        payload.userId = current_user_id
    return await get_store(request).create_session(payload)


@router.get("/api/sessions/{session_id}")
async def get_session(session_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    session = await get_store(request).get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await require_age_confirmed(get_store(request), current_user_id)
    if current_user_id and session.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Session does not belong to this user")
    messages = await get_store(request).get_messages(session_id)
    return {"session": session, "messages": messages}


@router.get("/api/users/{user_id}/sessions")
async def get_user_sessions(user_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    await require_age_confirmed(get_store(request), current_user_id)
    resolved_user_id = current_user_id or user_id
    return await get_store(request).list_user_sessions(resolved_user_id)


@router.get("/api/users/{user_id}/hint-summary")
async def get_user_hint_summary(user_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    await require_age_confirmed(get_store(request), current_user_id)
    resolved_user_id = current_user_id or user_id
    if current_user_id and current_user_id != resolved_user_id:
        raise HTTPException(status_code=403, detail="Hint summary does not belong to this user")
    return await get_store(request).user_hint_summary(resolved_user_id)


@router.post("/api/sessions/{session_id}/message")
async def send_message(session_id: str, payload: MessageCreate, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    store = get_store(request)
    session = await store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await require_age_confirmed(store, current_user_id)
    if current_user_id and session.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Session does not belong to this user")
    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Session already completed")
    safety = await request.app.state.safety_scope.evaluate_message(
        user_id=session.userId,
        session_id=session_id,
        message=payload.content,
        practice_type=session.practiceType,
        difficulty=session.difficulty,
    )
    user_message = await store.add_message(session_id, "user", payload.content)
    if not safety.allow_response:
        ai_message = await store.add_message(session_id, "ai", safety.redirect_message or "I can help keep this as safe communication practice.")
        session.turnCount += 1
        await store.update_session(session)
        return {"userMessage": user_message, "aiMessage": ai_message, "turnCount": session.turnCount, "safety": safety.model_dump()}
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
    hint = await request.app.state.coach.maybe_generate_hint(session, history, payload.content, coordination_state)
    ai_message = await store.add_message(session_id, "ai", ai_content)
    session.turnCount += 1
    await store.update_session(session)
    return {"userMessage": user_message, "aiMessage": ai_message, "turnCount": session.turnCount, "hint": hint}


@router.get("/api/sessions/{session_id}/hints")
async def get_session_hints(session_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    store = get_store(request)
    session = await store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user_id and session.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Session does not belong to this user")
    return await store.list_session_hints(session_id, current_user_id or session.userId)


@router.post("/api/session-hints/{hint_id}")
async def update_session_hint(hint_id: str, payload: dict, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    hint = await get_store(request).update_session_hint(hint_id, {
        "wasViewed": bool(payload.get("wasViewed", True)),
        "wasExpanded": bool(payload.get("wasExpanded", False)),
    })
    if not hint:
        raise HTTPException(status_code=404, detail="Hint not found")
    return hint


@router.post("/api/sessions/{session_id}/end")
async def end_session(session_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    store = get_store(request)
    session = await store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await require_age_confirmed(store, current_user_id)
    if current_user_id and session.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Session does not belong to this user")
    session.status = "completed"
    session.completedAt = utc_now_iso()
    return await store.update_session(session)
