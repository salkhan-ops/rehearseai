from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response

from app.routes.admin import require_admin_mvp
from app.services.telemetry_service import TelemetryService
from app.utils.security import get_current_user_id
from app.utils.timestamps import utc_now_iso

router = APIRouter()


def get_telemetry(request: Request) -> TelemetryService:
    return request.app.state.telemetry


@router.post("/api/telemetry/turn")
async def save_turn_telemetry(payload: dict, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if current_user_id:
        payload["userId"] = current_user_id
    record = await get_telemetry(request).save_turn_telemetry(payload)
    return {"saved": bool(record), "telemetry": record}


@router.post("/api/telemetry/session-outcome")
async def save_session_outcome(payload: dict, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if current_user_id:
        payload["userId"] = current_user_id
    outcome = await get_telemetry(request).save_session_outcome(payload)
    return {"saved": bool(outcome), "outcome": outcome}


@router.post("/api/telemetry/local-signals")
async def save_local_signal_telemetry(payload: dict, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if current_user_id:
        payload["userId"] = current_user_id
    record = await get_telemetry(request).save_local_signal_telemetry(payload)
    return {"saved": bool(record), "telemetry": record}


@router.get("/api/telemetry/user-summary/{user_id}")
async def get_user_telemetry_summary(user_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    resolved_user_id = current_user_id or user_id
    if current_user_id and current_user_id != user_id:
        raise HTTPException(status_code=403, detail="Telemetry summary does not belong to this user")
    return await get_telemetry(request).get_user_telemetry_summary(resolved_user_id)


@router.get("/api/telemetry/speech-profile/{user_id}")
async def get_personal_speech_profile(user_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    resolved_user_id = current_user_id or user_id
    if current_user_id and current_user_id != user_id:
        raise HTTPException(status_code=403, detail="Speech profile does not belong to this user")
    return await get_telemetry(request).get_personal_speech_profile(resolved_user_id)


@router.get("/api/telemetry/privacy-settings/{user_id}")
async def get_privacy_settings(user_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    resolved_user_id = current_user_id or user_id
    if current_user_id and current_user_id != user_id:
        raise HTTPException(status_code=403, detail="Privacy settings do not belong to this user")
    return await request.app.state.store.get_user_privacy_settings(resolved_user_id)


@router.post("/api/telemetry/privacy-settings")
async def update_privacy_settings(payload: dict, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    user_id = current_user_id or payload.get("userId") or "guest"
    return await request.app.state.store.update_user_privacy_settings(user_id, payload)


@router.post("/api/telemetry/export-training-data")
async def export_training_data(payload: dict, request: Request):
    await require_admin_mvp()
    export_format = str(payload.get("format") or "jsonl").lower()
    if export_format not in {"jsonl", "csv"}:
        raise HTTPException(status_code=400, detail="Export format must be jsonl or csv")
    content, media_type = await get_telemetry(request).export_training_dataset(export_format=export_format, limit_count=int(payload.get("limit") or 1000))
    extension = "csv" if export_format == "csv" else "jsonl"
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="rehearseai-training-data.{extension}"'},
    )


@router.get("/api/admin/telemetry-samples")
async def admin_telemetry_samples(request: Request, limit: int = 50):
    await require_admin_mvp()
    records = await request.app.state.store.list_conversation_telemetry(limit_count=limit)
    return [get_telemetry(request).anonymize_telemetry_record(record) | {"telemetryId": record.get("telemetryId"), "createdAt": record.get("createdAt")} for record in records]


@router.get("/api/admin/local-signals")
async def admin_local_signal_diagnostics(request: Request):
    await require_admin_mvp()
    return await get_telemetry(request).get_local_signal_diagnostics()


@router.post("/api/admin/telemetry-labels")
async def create_telemetry_label(payload: dict, request: Request):
    await require_admin_mvp()
    telemetry_id = payload.get("telemetryId")
    if not telemetry_id:
        raise HTTPException(status_code=400, detail="telemetryId is required")
    label_id = str(payload.get("labelId") or uuid4())
    label = {
        "labelId": label_id,
        "telemetryId": telemetry_id,
        "labeledBy": payload.get("labeledBy") or "admin",
        "labels": payload.get("labels") or {},
        "notes": payload.get("notes") or "",
        "createdAt": utc_now_iso(),
    }
    return await request.app.state.store.save_telemetry_label(label)


@router.get("/api/admin/telemetry-labels")
async def list_telemetry_labels(request: Request, telemetryId: Optional[str] = None):
    await require_admin_mvp()
    return await request.app.state.store.list_telemetry_labels(telemetry_id=telemetryId)
