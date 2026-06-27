import hashlib
import hmac
import time

from fastapi import APIRouter, HTTPException, Request
from app.config import get_settings
from app.services.paddle_service import PaddleService

router = APIRouter()


def _verify_paddle_signature(body: bytes, header: str, secret: str) -> bool:
    """Verify Paddle webhook signature (HMAC-SHA256).
    Header format: ts=<timestamp>;h1=<hex_digest>
    Signed payload: <ts>:<raw_body>
    """
    try:
        parts = dict(part.split("=", 1) for part in header.split(";"))
        ts = parts.get("ts", "")
        h1 = parts.get("h1", "")
        # Reject timestamps older than 5 minutes to block replay attacks
        if abs(time.time() - int(ts)) > 300:
            return False
        signed = f"{ts}:{body.decode('utf-8')}".encode()
        expected = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, h1)
    except Exception:
        return False


@router.get("/api/payments/plans")
async def plans():
    return PaddleService().plans()


@router.post("/api/payments/paddle/webhook")
async def paddle_webhook(request: Request):
    body = await request.body()
    settings = get_settings()

    if settings.paddle_webhook_secret:
        sig_header = request.headers.get("Paddle-Signature", "")
        if not sig_header or not _verify_paddle_signature(body, sig_header, settings.paddle_webhook_secret):
            raise HTTPException(status_code=401, detail="Invalid Paddle signature")

    import json
    payload = json.loads(body)
    return await PaddleService().process_webhook(payload, request.app.state.store)
