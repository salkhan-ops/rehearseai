from typing import Optional

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

    async def current_subscription(self, store, uid: str) -> dict:
        subscription = await store.get_current_subscription(uid)
        plans = {plan["id"]: plan for plan in self.plans()}
        return {
            **subscription,
            "plan": plans.get(subscription.get("planId", "free"), plans["free"]),
            "billingProvider": "paddle",
            "portalConfigured": False,
        }

    async def cancel_subscription(self, store, uid: str, reason: Optional[str] = None) -> dict:
        # TODO: Call Paddle API to set scheduled_change/cancel at period end.
        return await store.update_subscription_status(uid, True, reason)

    async def reactivate_subscription(self, store, uid: str) -> dict:
        # TODO: Call Paddle API to remove scheduled cancellation.
        return await store.update_subscription_status(uid, False)

    async def portal_link(self, uid: str) -> dict:
        # TODO: Replace with Paddle customer portal/session link when configured.
        return {
            "url": None,
            "provider": "paddle",
            "message": "Paddle customer portal is not configured yet. Contact billing support for subscription changes.",
            "uid": uid,
        }
