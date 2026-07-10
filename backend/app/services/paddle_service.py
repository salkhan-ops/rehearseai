from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import uuid4

import httpx

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


def _first_string(*values: Any) -> str:
    for value in values:
        if isinstance(value, str) and value:
            return value
    return ""


def _find_custom_value(value: Any, keys: set[str]) -> str:
    if isinstance(value, dict):
        for key in keys:
            found = value.get(key)
            if isinstance(found, str) and found:
                return found
        for nested_key in ("custom_data", "customData"):
            found = _find_custom_value(value.get(nested_key), keys)
            if found:
                return found
        for nested in value.values():
            found = _find_custom_value(nested, keys)
            if found:
                return found
    if isinstance(value, list):
        for item in value:
            found = _find_custom_value(item, keys)
            if found:
                return found
    return ""


def _item_price_id(items: list[dict]) -> str:
    for item in items:
        price = item.get("price", {})
        price_id = _first_string(
            price.get("id") if isinstance(price, dict) else "",
            item.get("price_id"),
            item.get("priceId"),
        )
        if price_id:
            return price_id
    return ""


def _customer_email(data: dict) -> str:
    customer = data.get("customer") if isinstance(data.get("customer"), dict) else {}
    return _first_string(
        data.get("email"),
        data.get("customer_email"),
        data.get("customerEmail"),
        customer.get("email"),
        customer.get("email_address"),
    ).lower()


class PaddleService:
    def _api_base_url(self) -> str:
        settings = get_settings()
        return "https://api.paddle.com" if settings.paddle_environment == "production" else "https://sandbox-api.paddle.com"

    async def _paddle_get(self, path: str, params: Optional[dict] = None) -> Optional[dict]:
        settings = get_settings()
        if not settings.paddle_api_key:
            return None
        try:
            async with httpx.AsyncClient(timeout=12) as client:
                response = await client.get(
                    f"{self._api_base_url()}{path}",
                    headers={"Authorization": f"Bearer {settings.paddle_api_key}"},
                    params=params,
                )
            if response.status_code >= 400:
                return None
            return response.json()
        except Exception:
            return None

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
            settings = get_settings()
            if price_id and price_id == settings.paddle_coach_price_id:
                return next((plan for plan in self.plans() if plan["id"] == "coach"), None)
            if price_id and price_id == settings.paddle_pro_price_id:
                return next((plan for plan in self.plans() if plan["id"] == "pro"), None)
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
        settings = get_settings()
        if price_id == settings.paddle_coach_price_id:
            return {"planId": "coach", "name": "Coach", "priceMonthly": 29}
        if price_id == settings.paddle_pro_price_id:
            return {"planId": "pro", "name": "Pro", "priceMonthly": 19}
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

    async def _uid_by_email(self, store, email: str) -> str:
        if not email or not store.client:
            return ""
        try:
            docs = store.client.collection("users").where("email", "==", email).limit(1).stream()
            for doc in docs:
                return doc.id
        except Exception:
            return ""
        return ""

    async def _uid_by_paddle_customer_id(self, store, customer_id: str) -> str:
        if not customer_id or not store.client:
            return ""
        try:
            docs = store.client.collection("userEntitlements").where("paddleCustomerId", "==", customer_id).limit(1).stream()
            for doc in docs:
                return doc.id
            docs = store.client.collection("users").where("paddleCustomerId", "==", customer_id).limit(1).stream()
            for doc in docs:
                return doc.id
        except Exception:
            return ""
        return ""

    async def _paddle_customer_email(self, customer_id: str) -> str:
        if not customer_id:
            return ""
        payload = await self._paddle_get(f"/customers/{customer_id}")
        data = (payload or {}).get("data", {})
        return _customer_email(data)

    async def _resolve_uid(self, store, data: dict) -> str:
        uid = _find_custom_value(data, {"uid", "userId", "user_id"})
        if uid:
            return uid
        email = _customer_email(data)
        if email:
            uid = await self._uid_by_email(store, email)
            if uid:
                return uid
        customer_id = data.get("customer_id", "")
        uid = await self._uid_by_paddle_customer_id(store, customer_id)
        if uid:
            return uid
        email = await self._paddle_customer_email(customer_id)
        if email:
            return await self._uid_by_email(store, email)
        return ""

    async def _write_subscription_record(self, store, uid: str, data: dict, plan_id: str, plan_name: str, price_id: str) -> None:
        paddle_sub_id = _first_string(data.get("subscription_id"), data.get("id"))
        if not paddle_sub_id:
            return
        status = data.get("status", "active")
        payload = {
            "subscriptionId": paddle_sub_id,
            "uid": uid,
            "paddleSubscriptionId": paddle_sub_id,
            "paddleCustomerId": data.get("customer_id", ""),
            "status": "active" if status in ("active", "trialing") else status,
            "currentPeriodStart": data.get("current_billing_period", {}).get("starts_at") if isinstance(data.get("current_billing_period"), dict) else None,
            "currentPeriodEnd": data.get("current_billing_period", {}).get("ends_at") if isinstance(data.get("current_billing_period"), dict) else None,
            "cancelAtPeriodEnd": bool(data.get("scheduled_change")),
            "cancelledAt": data.get("canceled_at"),
            "planId": plan_id,
            "planName": plan_name,
            "priceId": price_id,
            "billingProvider": "paddle",
            "updatedAt": _utc_now(),
        }
        payload.setdefault("createdAt", _utc_now())
        if store.client:
            store.client.collection("billing_subscriptions").document(paddle_sub_id).set(payload, merge=True)
            if payload["paddleCustomerId"]:
                store.client.collection("billing_customers").document(payload["paddleCustomerId"]).set({
                    "uid": uid,
                    "paddleCustomerId": payload["paddleCustomerId"],
                    "email": _customer_email(data),
                    "updatedAt": _utc_now(),
                }, merge=True)
        store.billing_subscriptions[paddle_sub_id] = payload

    async def process_webhook(self, payload: dict, store) -> dict:
        event_type = payload.get("event_type", "")
        data = payload.get("data", {})
        uid = await self._resolve_uid(store, data)
        items = data.get("items", [])
        price_id = _item_price_id(items)
        paddle_customer_id = data.get("customer_id", "")
        paddle_sub_id = _first_string(data.get("subscription_id"), data.get("id"))

        if not uid:
            _log_webhook_error(store, event_type, "", "no uid in custom_data", payload)
            return {"received": True, "warning": "no uid in custom_data — cannot sync entitlements", "event": event_type}

        # ── Subscription activated / updated ────────────────────────────────
        if event_type in ("subscription.created", "subscription.activated", "subscription.updated"):
            plan = await self._plan_by_price_id(store, price_id)
            plan_id = (plan.get("planId") or plan.get("id") or "pro") if plan else "pro"
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
            await self._write_subscription_record(store, uid, data, plan_id, plan_name, price_id)
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

    async def sync_active_subscription_for_user(self, store, uid: str) -> dict:
        profile = await store.admin_get_user(uid) or {}
        email = (profile.get("email") or "").lower()
        if not email:
            return {"synced": False, "reason": "user has no email", "uid": uid}

        customers_payload = await self._paddle_get("/customers", {"email": email})
        customers = (customers_payload or {}).get("data", [])
        if not customers:
            return {"synced": False, "reason": "no Paddle customer for email", "uid": uid, "email": email}

        for customer in customers:
            customer_id = customer.get("id", "")
            subscriptions_payload = await self._paddle_get("/subscriptions", {"customer_id": customer_id})
            subscriptions = (subscriptions_payload or {}).get("data", [])
            active = [item for item in subscriptions if item.get("status") in ("active", "trialing")]
            for subscription in active:
                items = subscription.get("items", [])
                price_id = _item_price_id(items)
                plan = await self._plan_by_price_id(store, price_id)
                if not plan:
                    continue
                plan_id = plan.get("planId") or plan.get("id") or "pro"
                plan_name = plan.get("name", plan_id.title())
                subscription["customer"] = customer
                await store.admin_assign_plan(uid, {
                    "planId": plan_id,
                    "status": "active",
                    "source": "paddle-sync",
                    "subscriptionId": subscription.get("id", ""),
                    "paddleCustomerId": customer_id,
                    "overrides": {},
                })
                await self._write_subscription_record(store, uid, subscription, plan_id, plan_name, price_id)
                return {
                    "synced": True,
                    "uid": uid,
                    "email": email,
                    "planId": plan_id,
                    "subscriptionId": subscription.get("id", ""),
                    "paddleCustomerId": customer_id,
                }

        return {"synced": False, "reason": "no active matched subscription", "uid": uid, "email": email}

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
