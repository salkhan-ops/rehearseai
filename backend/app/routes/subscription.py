from typing import Optional
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from app.services.paddle_service import PaddleService
from app.utils.security import get_current_user_id

router = APIRouter()


class CancelSubscriptionRequest(BaseModel):
    reason: Optional[str] = Field(default=None, max_length=1000)


class DeleteAccountRequest(BaseModel):
    reason: Optional[str] = Field(default=None, max_length=1000)


def resolve_user(current_user_id: Optional[str]) -> str:
    return current_user_id or "guest"


@router.get("/api/subscription/current")
async def current_subscription(request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    uid = resolve_user(current_user_id)
    service = PaddleService()
    subscription = await service.current_subscription(request.app.state.store, uid)
    if uid != "guest" and subscription.get("planId") == "free":
        sync_result = await service.sync_active_subscription_for_user(request.app.state.store, uid)
        if sync_result.get("synced"):
            subscription = await service.current_subscription(request.app.state.store, uid)
            subscription["syncResult"] = sync_result
    return subscription


@router.post("/api/subscription/cancel")
async def cancel_subscription(payload: CancelSubscriptionRequest, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    return await PaddleService().cancel_subscription(request.app.state.store, resolve_user(current_user_id), payload.reason)


@router.post("/api/subscription/reactivate")
async def reactivate_subscription(request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    return await PaddleService().reactivate_subscription(request.app.state.store, resolve_user(current_user_id))


@router.get("/api/subscription/portal-link")
async def subscription_portal_link(current_user_id: Optional[str] = Depends(get_current_user_id)):
    return await PaddleService().portal_link(resolve_user(current_user_id))


@router.post("/api/account/delete-request")
async def delete_account(payload: DeleteAccountRequest, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    return await request.app.state.store.soft_delete_user(resolve_user(current_user_id), payload.reason)
