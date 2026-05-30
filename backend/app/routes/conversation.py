from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request

from app.services.conversation_coordination_service import (
    CalibrationCompleteRequest,
    ConversationCoordinationService,
    CoordinationAnalyzeRequest,
)
from app.services.firestore_service import FirestoreService
from app.utils.security import get_current_user_id

router = APIRouter()


def get_store(request: Request) -> FirestoreService:
    return request.app.state.store


def get_coordination(request: Request) -> ConversationCoordinationService:
    return request.app.state.conversation_coordination


@router.post("/api/voice/calibration/start")
async def start_voice_calibration(payload: dict, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    user_id = current_user_id or payload.get("userId") or "guest"
    return await get_coordination(request).start_calibration(user_id)


@router.post("/api/voice/calibration/complete")
async def complete_voice_calibration(payload: CalibrationCompleteRequest, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if current_user_id:
        payload.userId = current_user_id
    return await get_coordination(request).complete_calibration(payload)


@router.get("/api/voice/profile/{user_id}")
async def get_voice_profile(user_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    resolved_user_id = current_user_id or user_id
    profile = await get_store(request).get_voice_profile(resolved_user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Voice profile not found")
    return profile


@router.post("/api/conversation/coordination/analyze")
async def analyze_conversation_coordination(payload: CoordinationAnalyzeRequest, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if current_user_id:
        payload.userId = current_user_id
    return await get_coordination(request).analyze(payload)
