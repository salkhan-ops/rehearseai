import asyncio
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request

from app.services.firestore_service import FirestoreService
from app.services.session_analysis_service import SessionAnalysisService
from app.utils.security import get_current_user_id

router = APIRouter()

_analysis_service = SessionAnalysisService()


def get_store(request: Request) -> FirestoreService:
    return request.app.state.store


@router.post("/api/sessions/{session_id}/analyze")
async def trigger_analysis(
    session_id: str,
    background_tasks: BackgroundTasks,
    request: Request,
    current_user_id: Optional[str] = Depends(get_current_user_id),
):
    """
    Fire-and-forget: starts coaching generation in the background.
    Returns immediately so the frontend is never blocked.
    """
    store = get_store(request)
    session = await store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user_id and session.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Session does not belong to this user")

    # Mark as generating so the frontend can show a loading state
    await store.save_session_analysis({
        "analysisId": session_id,
        "sessionId": session_id,
        "status": "generating",
        "turns": [],
        "summary": {},
    })

    async def _run():
        await _analysis_service.generate(session, store)

    background_tasks.add_task(asyncio.ensure_future, _run())
    return {"status": "generating"}


@router.get("/api/sessions/{session_id}/analysis")
async def get_analysis(
    session_id: str,
    request: Request,
    current_user_id: Optional[str] = Depends(get_current_user_id),
):
    store = get_store(request)
    session = await store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user_id and session.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Session does not belong to this user")

    analysis = await store.get_session_analysis(session_id)
    if not analysis:
        return {"status": "not_found"}
    return analysis
