from fastapi import APIRouter, Request
from app.services.paddle_service import PaddleService

router = APIRouter()


@router.get("/api/payments/plans")
async def plans():
    return PaddleService().plans()


@router.post("/api/payments/paddle/webhook")
async def paddle_webhook(request: Request):
    payload = await request.json()
    return await PaddleService().verify_webhook(payload)
