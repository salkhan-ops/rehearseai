from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4

from app.config import get_settings


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _log_revenue(store, uid: str, event_type: str, product_type: str, amount: float,
                 currency: str = "USD", plan_id: str = "", plan_name: str = "",
                 package_id: str = "", package_title: str = "",
                 paddle_transaction_id: str = "", paddle_subscription_id: str = "",
                 paddle_customer_id: str = "", price_id: str = "", status: str = "paid") -> None:
    if not store.client:
        return
    try:
        record = {
            "id": str(uuid4()),
            "uid": uid,
            "eventType": event_type,
            "productType": product_type,
            "amount": amount,
            "currency": currency,
            "planId": plan_id,
            "planName": plan_name,
            "packageId": package_id,
            "packageTitle": package_title,
            "paddleTransactionId": paddle_transaction_id,
            "paddleSubscriptionId": paddle_subscription_id,
            "paddleCustomerId": paddle_customer_id,
            "priceId": price_id,
            "status": status,
            "createdAt": _utc_now(),
        }
        store.client.collection("revenueTransactions").document(record["id"]).set(record)
    except Exception:
        pass


def _log_webhook_error(store, event_type: str, uid: str, error: str, payload: dict) -> None:
    if not store.client:
        return
    try:
        store.client.collection("webhookErrors").document(str(uuid4())).set({
            "eventType": event_type,
            "uid": uid,
            "error": error,
            "payloadSnapshot": str(payload)[:2000],
            "resolved": False,
            "createdAt": _utc_now(),
        })
    except Exception:
        pass


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
            _log_webhook_error(store, event_type, "", "no uid in custom_data", payload)
            return {"received": True, "warning": "no uid in custom_data — cannot sync entitlements", "event": event_type}

        # ── Subscription activated / updated ────────────────────────────────
        if event_type in ("subscription.created", "subscription.activated", "subscription.updated"):
            plan = await self._plan_by_price_id(store, price_id)
            plan_id = plan.get("planId", "pro") if plan else "pro"
            plan_name = plan.get("name", plan_id.title()) if plan else plan_id.title()
            price_monthly = float(plan.get("priceMonthly", 0)) if plan else 0.0
            await store.admin_assign_plan(uid, {
                "planId": plan_id,
                "status": "active",
                "source": "paddle",
                "subscriptionId": paddle_sub_id,
                "paddleCustomerId": paddle_customer_id,
                "overrides": {},
            })
            _log_revenue(store, uid, event_type, "subscription", price_monthly, "USD",
                         plan_id=plan_id, plan_name=plan_name,
                         paddle_subscription_id=paddle_sub_id,
                         paddle_customer_id=paddle_customer_id, price_id=price_id)
            return {"received": True, "event": event_type, "uid": uid, "planId": plan_id}

        # ── Subscription canceled ────────────────────────────────────────────
        if event_type == "subscription.canceled":
            # Read current entitlements to capture plan name for churn log
            ent = {}
            if store.client:
                try:
                    doc_snap = store.client.collection("userEntitlements").document(uid).get()
                    if doc_snap.exists:
                        ent = doc_snap.to_dict() or {}
                except Exception:
                    pass
            canceled_plan = ent.get("planId", "unknown")
            canceled_plan_name = ent.get("planName", canceled_plan.title())
            await store.admin_assign_plan(uid, {
                "planId": "free",
                "status": "canceled",
                "source": "paddle",
                "subscriptionId": paddle_sub_id,
                "paddleCustomerId": paddle_customer_id,
                "overrides": {},
            })
            # Revenue log (negative = churn)
            _log_revenue(store, uid, event_type, "subscription", 0.0, "USD",
                         plan_id=canceled_plan, plan_name=canceled_plan_name,
                         paddle_subscription_id=paddle_sub_id,
                         paddle_customer_id=paddle_customer_id, price_id=price_id,
                         status="canceled")
            # Churn register
            if store.client:
                try:
                    store.client.collection("churnEvents").document(str(uuid4())).set({
                        "uid": uid,
                        "planId": canceled_plan,
                        "planName": canceled_plan_name,
                        "paddleSubscriptionId": paddle_sub_id,
                        "paddleCustomerId": paddle_customer_id,
                        "reason": data.get("cancellation_details", {}).get("reason", ""),
                        "comment": data.get("cancellation_details", {}).get("comment", ""),
                        "effectiveAt": data.get("canceled_at", _utc_now()),
                        "createdAt": _utc_now(),
                    })
                except Exception:
                    pass
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
                    pkg_price = float(package.get("price", 0))
                    _log_revenue(store, uid, event_type, "course_package", pkg_price, "USD",
                                 package_id=package.get("packageId", ""),
                                 package_title=package.get("title", ""),
                                 paddle_transaction_id=data.get("id", ""),
                                 paddle_customer_id=paddle_customer_id, price_id=price_id)
                    return {"received": True, "event": event_type, "uid": uid, "packageId": package.get("packageId")}
                except Exception as exc:
                    _log_webhook_error(store, event_type, uid, str(exc), payload)
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
