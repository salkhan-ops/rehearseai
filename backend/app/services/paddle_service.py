from datetime import datetime, timedelta, timezone
from typing import Optional

from app.config import get_settings


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class PaddleService:
    def plans(self) -> list[dict]:
        settings = get_settings()
        return [
            {"id": "free", "name": "Free", "price": "$0", "features": ["5 sessions/month", "Basic feedback"]},
            {
                "id": "pro",
                "name": "Pro",
                "price": "$19/mo",
                "paddlePriceId": settings.paddle_pro_price_id,
                "features": ["20 sessions/month", "Advanced reports", "Course templates", "Session history"],
            },
            {
                "id": "coach",
                "name": "Coach",
                "price": "$29/mo",
                "paddlePriceId": settings.paddle_coach_price_id,
                "features": ["45 sessions/month", "Brutal & Nerve modes", "Advanced personas", "Deep analytics"],
            },
        ]

    async def _plan_by_price_id(self, store, price_id: str) -> Optional[dict]:
        if not price_id or not store.client:
            return None
        try:
            docs = store.client.collection("plans").where("paddleMonthlyPriceId", "==", price_id).limit(1).stream()
            for doc in docs:
                return doc.to_dict()
            docs = store.client.collection("plans").where("paddleYearlyPriceId", "==", price_id).limit(1).stream()
            for doc in docs:
                return doc.to_dict()
        except Exception:
            pass
        return None

    async def _package_by_price_id(self, store, price_id: str) -> Optional[dict]:
        if not price_id or not store.client:
            return None
        try:
            docs = store.client.collection("coursePackages").where("paddlePriceId", "==", price_id).limit(1).stream()
            for doc in docs:
                return doc.to_dict()
        except Exception:
            pass
        return None

    async def process_webhook(self, payload: dict, store) -> dict:
        event_type = payload.get("event_type", "")
        data = payload.get("data", {})
        custom_data = data.get("custom_data") or {}
        uid = custom_data.get("uid") or custom_data.get("userId") or ""
        items = data.get("items", [])
        price_id = items[0].get("price", {}).get("id", "") if items else ""
        paddle_customer_id = data.get("customer_id", "")
        paddle_sub_id = data.get("id", "")

        if not uid:
            return {"received": True, "warning": "no uid in custom_data — cannot sync entitlements", "event": event_type}

        # ── Subscription activated / updated ────────────────────────────────
        if event_type in ("subscription.created", "subscription.activated", "subscription.updated"):
            plan = await self._plan_by_price_id(store, price_id)
            plan_id = plan.get("planId", "pro") if plan else "pro"
            await store.admin_assign_plan(uid, {
                "planId": plan_id,
                "status": "active",
                "source": "paddle",
                "subscriptionId": paddle_sub_id,
                "paddleCustomerId": paddle_customer_id,
                "overrides": {},
            })
            return {"received": True, "event": event_type, "uid": uid, "planId": plan_id}

        # ── Subscription canceled ────────────────────────────────────────────
        if event_type == "subscription.canceled":
            await store.admin_assign_plan(uid, {
                "planId": "free",
                "status": "canceled",
                "source": "paddle",
                "subscriptionId": paddle_sub_id,
                "paddleCustomerId": paddle_customer_id,
                "overrides": {},
            })
            return {"received": True, "event": event_type, "uid": uid, "planId": "free"}

        # ── One-time purchase (course package) ───────────────────────────────
        if event_type == "transaction.completed":
            package = await self._package_by_price_id(store, price_id)
            if package and store.client:
                try:
                    from google.cloud.firestore_v1 import ArrayUnion
                    purchased_at = datetime.now(timezone.utc)
                    expires_at = purchased_at + timedelta(days=int(package.get("durationDays", 7)))
                    purchase = {
                        "packageId": package.get("packageId", ""),
                        "title": package.get("title", "Course Package"),
                        "practiceType": package.get("practiceType", ""),
                        "durationDays": package.get("durationDays", 7),
                        "sessionsTotal": package.get("sessionsIncluded", 7),
                        "sessionsUsed": 0,
                        "purchasedAt": purchased_at.isoformat(),
                        "expiresAt": expires_at.isoformat(),
                        "paddleTransactionId": data.get("id", ""),
                        "paddlePriceId": price_id,
                        "status": "active",
                    }
                    store.client.collection("userEntitlements").document(uid).set(
                        {"purchases": ArrayUnion([purchase]), "updatedAt": _utc_now()},
                        merge=True,
                    )
                    return {"received": True, "event": event_type, "uid": uid, "packageId": package.get("packageId")}
                except Exception as exc:
                    return {"received": True, "event": event_type, "error": str(exc)}
            return {"received": True, "event": event_type, "uid": uid, "warning": "package not found for price_id"}

        return {"received": True, "event": event_type, "uid": uid}

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
        return await store.update_subscription_status(uid, True, reason)

    async def reactivate_subscription(self, store, uid: str) -> dict:
        return await store.update_subscription_status(uid, False)

    async def portal_link(self, uid: str) -> dict:
        return {
            "url": None,
            "provider": "paddle",
            "message": "To manage your subscription contact support or visit your Paddle receipts email.",
            "uid": uid,
        }
