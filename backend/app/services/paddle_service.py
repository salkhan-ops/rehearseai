from app.config import get_settings


class PaddleService:
    def plans(self) -> list[dict]:
        settings = get_settings()
        return [
            {"id": "free", "name": "Free", "price": "$0", "features": ["3 sessions/month", "Basic feedback"]},
            {
                "id": "pro",
                "name": "Pro",
                "price": "$19/mo",
                "paddlePriceId": settings.paddle_pro_price_id,
                "features": ["Unlimited sessions", "Advanced reports", "Brutal mode", "Session history"],
            },
            {
                "id": "coach",
                "name": "Coach",
                "price": "$49/mo",
                "paddlePriceId": settings.paddle_coach_price_id,
                "features": ["Advanced personas", "Detailed analytics", "Priority features"],
            },
        ]

    async def verify_webhook(self, payload: dict) -> dict:
        # TODO: Verify Paddle webhook signature with PADDLE_WEBHOOK_SECRET.
        settings = get_settings()
        return {"received": True, "environment": settings.paddle_environment, "event": payload.get("event_type", "unknown")}
