from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from app.services.report_service import ReportService
from app.utils.security import get_current_user_id

router = APIRouter()


@router.get("/api/reports/{report_id}")
async def get_report(report_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    report = await request.app.state.store.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if current_user_id and report.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Report does not belong to this user")
    return report


@router.post("/api/sessions/{session_id}/report")
async def create_report(session_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    store = request.app.state.store
    session = await store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user_id and session.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Session does not belong to this user")
    service = ReportService(store, request.app.state.ai)
    return await service.generate_report(session)


@router.get("/api/reports/{report_id}/analytics")
async def get_report_analytics(report_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    store = request.app.state.store
    report = await store.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if current_user_id and report.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Report does not belong to this user")
    existing = await store.get_analytics_by_report(report)
    if existing:
        return existing
    session = await store.get_session(report.sessionId)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = await store.get_messages(session.id)
    previous_sessions = await store.list_user_sessions(session.userId)
    historical = await store.get_historical_performance(session.userId)
    analytics = await request.app.state.ai.generate_performance_analytics(
        session, report, messages, len(previous_sessions), historical
    )
    return await store.save_analytics(analytics)
