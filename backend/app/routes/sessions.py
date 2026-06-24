from typing import Optional
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Request
from app.models.message import MessageCreate
from app.models.session import SessionCreate
from app.services.gemini_service import GeminiService
from app.services.firestore_service import FirestoreService
from app.services.conversation_coordination_service import ConversationCoordinationService, CoordinationAnalyzeRequest
from app.services.cross_examination_service import CrossExaminationService
from app.utils.security import get_current_user_id
from app.utils.timestamps import utc_now_iso

router = APIRouter()


def get_store(request: Request) -> FirestoreService:
    return request.app.state.store


def get_ai(request: Request) -> GeminiService:
    return request.app.state.ai


def get_coordination(request: Request) -> ConversationCoordinationService:
    return request.app.state.conversation_coordination


def get_cross_examination(request: Request) -> CrossExaminationService:
    return request.app.state.cross_examination


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
    # Single entitlement lookup covers all plan checks
    ents: dict = {}
    if current_user_id:
        raw = await get_store(request).get_user_entitlements(current_user_id)
        ents = raw.get("entitlements") or {}
    if payload.difficulty == "Nerve" and current_user_id:
        if not (ents.get("allowNerveMode", False) or ents.get("allowBrutalMode", False)):
            raise HTTPException(status_code=403, detail="Nerve Mode requires Pro or Coach.")
    if payload.documentText and current_user_id:
        daily_limit = ents.get("docGroundingDocsPerDay", 1)
        if daily_limit != "unlimited":
            daily_count = await get_store(request).get_daily_doc_count(current_user_id)
            if daily_count >= int(daily_limit):
                raise HTTPException(status_code=429, detail=f"Daily document limit reached ({daily_limit}/day). Resets at midnight UTC.")
            await get_store(request).increment_daily_doc_count(current_user_id)
    # Enforce plan-based session duration cap — users cannot exceed their tier limit
    max_minutes: int = int(ents.get("maxSessionMinutes", 15))
    payload.durationPreference = min(payload.durationPreference, max_minutes)
    session = await get_store(request).create_session(payload)
    if session.difficulty == "Nerve":
        session = await get_cross_examination(request).prepare_session(session)
    opening = await get_ai(request).generate_opening_response(session)
    await get_store(request).add_message(session.id, "ai", opening)
    return session


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
    # Resolve the plan's turn limit so the prompt builder can signal wrap-up
    msg_ents: dict = {}
    if current_user_id:
        msg_raw = await store.get_user_entitlements(current_user_id)
        msg_ents = msg_raw.get("entitlements") or {}
    max_turns: int = int(msg_ents.get("maxMessagesPerSession", 16))
    safety = await request.app.state.safety_scope.evaluate_message(
        user_id=session.userId,
        session_id=session_id,
        message=payload.content,
        practice_type=session.practiceType,
        difficulty=session.difficulty,
    )
    user_metadata = {
        "conversationMode": payload.conversationMode,
        "turnTiming": payload.turnTiming,
        "speechEmotion": payload.speechEmotion,
        "speechDurationMs": payload.speechDurationMs,
        "silenceMs": payload.silenceMs,
    } if payload.conversationMode or payload.turnTiming or payload.speechEmotion else None
    user_message = await store.add_message(session_id, "user", payload.content, user_metadata)
    if payload.turnTiming:
        timing_decision = payload.turnTiming.get("pauseDecision")
        if not timing_decision and payload.coordinationContext:
            timing_decision = payload.coordinationContext.get("pauseDecision")
        await store.save_conversation_turn_timing({
            "timingId": str(uuid4()),
            "userId": session.userId,
            "sessionId": session_id,
            "turnId": user_message.id,
            "silenceMs": int(payload.turnTiming.get("silenceMs") or payload.silenceMs or 0),
            "decision": timing_decision,
            "cameraAssisted": bool(payload.turnTiming.get("cameraAssisted", False)),
            "transcriptLength": len(payload.content or ""),
            "gentlePromptShown": bool(payload.turnTiming.get("gentlePromptShown", False)),
            "forceResolutionTriggered": bool(payload.turnTiming.get("forceResolutionTriggered", False)),
            "hardTimeoutTriggered": bool(payload.turnTiming.get("hardTimeoutTriggered", False)),
            "createdAt": utc_now_iso(),
        })
    if not safety.allow_response:
        ai_message = await store.add_message(session_id, "ai", safety.redirect_message or "I can help keep this as safe communication practice.")
        is_first_turn = session.turnCount == 0
        session.turnCount += 1
        session.lastActivityAt = utc_now_iso()
        await store.update_session(session)
        if is_first_turn:
            await store.increment_monthly_session_count(session.userId)
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
            mode=session.difficulty,
            currentPressureLevel=session.pressureLevel,
            turnId=user_message.id,
            turnCount=session.turnCount,
            activePanelPersona=session.nervePersona,
            safetyRiskLevel=safety.risk_level,
            cameraAssisted=bool((payload.coordinationContext or {}).get("cameraAssisted", False)),
            cameraHesitation=bool((payload.coordinationContext or {}).get("cameraHesitation", False)),
            conversationState=payload.conversationState,
        )
    )
    coordination_context = get_coordination(request).prompt_context(coordination_state)
    coordination_context = {**(coordination_context or {}), "maxTurns": max_turns}
    if payload.conversationState:
        coordination_context = {
            **(coordination_context or {}),
            "conversationState": payload.conversationState.model_dump(),
        }
    if payload.coordinationContext:
        coordination_context = {
            **(coordination_context or {}),
            "pauseDecision": payload.coordinationContext.get("pauseDecision"),
            "userStateApprox": payload.coordinationContext.get("userStateApprox"),
            "adjustedWaitMs": payload.coordinationContext.get("adjustedWaitMs"),
            "cameraAssisted": bool(payload.coordinationContext.get("cameraAssisted", False)),
            "instruction": "User appears to need longer thinking pauses. Wait before follow-up questions and avoid cutting in too early."
            if payload.coordinationContext.get("pauseDecision") in {"wait", "keep_listening", "gentle_prompt"}
            else (coordination_context or {}).get("instruction"),
        }
    if session.difficulty == "Nerve":
        nerve_context = await get_cross_examination(request).build_turn_context(session, history, payload.content, coordination_state)
        coordination_state.pressureLevel = session.pressureLevel
        coordination_state.conversationControl.pressureLevel = session.pressureLevel
        coordination_context = {**(coordination_context or {}), "nerve": nerve_context}
        if coordination_context.get("conversationControl"):
            coordination_context["conversationControl"]["pressureLevel"] = session.pressureLevel
    elif session.difficulty in {"Beginner", "Friendly", "Intermediate", "Realistic", "Advanced", "Brutal"}:
        session.pressureLevel = coordination_state.pressureLevel
    ai_content = await get_ai(request).generate_roleplay_response(session, history, coordination_context)
    hint = await request.app.state.coach.maybe_generate_hint(session, history, payload.content, coordination_state)
    ai_message = await store.add_message(session_id, "ai", ai_content)
    is_first_turn = session.turnCount == 0
    session.turnCount += 1
    session.lastActivityAt = utc_now_iso()
    dynamics = await get_coordination(request).log_dynamics(user_id=session.userId, session_id=session_id, turn_id=user_message.id, state=coordination_state)
    await store.update_session(session)
    if is_first_turn:
        await store.increment_monthly_session_count(session.userId)
    return {"userMessage": user_message, "aiMessage": ai_message, "turnCount": session.turnCount, "hint": hint, "dynamics": dynamics, "conversationControl": coordination_state.conversationControl.model_dump()}


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


@router.post("/api/sessions/admin/cleanup-ghosts")
async def cleanup_ghost_sessions(request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    cleaned = await get_store(request).cleanup_ghost_sessions()
    return {"cleaned": cleaned}


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
