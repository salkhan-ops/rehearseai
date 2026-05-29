from typing import Optional
from uuid import uuid4
from google.cloud import firestore
from app.config import get_settings
from app.models.message import Message
from app.models.report import Report
from app.models.analytics import PerformanceAnalytics, ReasoningTree
from app.models.session import Session, SessionCreate
from app.utils.timestamps import utc_now_iso


DEFAULT_ENTITLEMENTS = {
    "maxSessionsPerMonth": 3,
    "maxMessagesPerSession": 16,
    "maxSessionMinutes": 15,
    "allowBrutalMode": False,
    "allowChallengeMode": False,
    "allowVoiceMode": True,
    "allowAdvancedAnalytics": False,
    "allowDecisionTree": False,
    "allowHistoricalTrends": False,
    "allowBenchmarking": False,
    "allowShareableReports": False,
    "allowReportExport": False,
    "allowSessionReplay": True,
    "allowLongitudinalMemory": False,
    "allowCustomPersonas": False,
    "allowTeachingMode": True,
    "allowInterviewMode": True,
    "allowPresentationMode": True,
    "allowSalaryNegotiationMode": True,
    "allowDifficultConversationMode": True,
    "allowSalesPitchMode": True,
    "reportDepth": "basic",
    "historyRetentionDays": 30,
    "monthlyGeminiTokenLimit": 50000,
}

DEFAULT_PLANS = [
    {"planId": "free", "name": "Free", "description": "3 sessions/month, basic feedback, limited history.", "priceMonthly": 0, "priceYearly": 0, "currency": "USD", "paddleProductId": "", "paddleMonthlyPriceId": "", "paddleYearlyPriceId": "", "isActive": True, "sortOrder": 1, "entitlements": DEFAULT_ENTITLEMENTS},
    {"planId": "pro", "name": "Pro", "description": "Unlimited sessions, advanced reports, brutal mode, history, shareable reports, decision trees, and challenge mode.", "priceMonthly": 19, "priceYearly": 190, "currency": "USD", "paddleProductId": "", "paddleMonthlyPriceId": "", "paddleYearlyPriceId": "", "isActive": True, "sortOrder": 2, "entitlements": {**DEFAULT_ENTITLEMENTS, "maxSessionsPerMonth": "unlimited", "allowBrutalMode": True, "allowChallengeMode": True, "allowAdvancedAnalytics": True, "allowDecisionTree": True, "allowHistoricalTrends": True, "allowShareableReports": True, "allowReportExport": True, "allowLongitudinalMemory": True, "reportDepth": "advanced", "historyRetentionDays": 365, "monthlyGeminiTokenLimit": 400000}},
    {"planId": "coach", "name": "Coach", "description": "Everything in Pro plus advanced personas, benchmarking, priority features, extended history, and advanced replay intelligence.", "priceMonthly": 49, "priceYearly": 490, "currency": "USD", "paddleProductId": "", "paddleMonthlyPriceId": "", "paddleYearlyPriceId": "", "isActive": True, "sortOrder": 3, "entitlements": {**DEFAULT_ENTITLEMENTS, "maxSessionsPerMonth": "unlimited", "maxMessagesPerSession": 80, "maxSessionMinutes": 90, "allowBrutalMode": True, "allowChallengeMode": True, "allowAdvancedAnalytics": True, "allowDecisionTree": True, "allowHistoricalTrends": True, "allowBenchmarking": True, "allowShareableReports": True, "allowReportExport": True, "allowLongitudinalMemory": True, "allowCustomPersonas": True, "reportDepth": "coach", "historyRetentionDays": "unlimited", "monthlyGeminiTokenLimit": 1200000}},
]


class FirestoreService:
    def __init__(self) -> None:
        settings = get_settings()
        self.enabled = bool(settings.firestore_project_id)
        self.client = firestore.Client(project=settings.firestore_project_id) if self.enabled else None
        self.sessions: dict[str, Session] = {}
        self.messages: dict[str, list[Message]] = {}
        self.reports: dict[str, Report] = {}
        self.analytics: dict[str, PerformanceAnalytics] = {}
        self.admin_plans: dict[str, dict] = {plan["planId"]: plan for plan in DEFAULT_PLANS}
        self.admin_users: dict[str, dict] = {}
        self.contact_submissions: dict[str, dict] = {}

    async def create_session(self, payload: SessionCreate) -> Session:
        session = Session(id=str(uuid4()), createdAt=utc_now_iso(), **payload.model_dump())
        if self.client:
            self.client.collection("sessions").document(session.id).set({**session.model_dump(), "sessionId": session.id, "updatedAt": session.createdAt})
        self.sessions[session.id] = session
        self.messages[session.id] = []
        return session

    async def get_session(self, session_id: str) -> Optional[Session]:
        if session_id in self.sessions:
            return self.sessions[session_id]
        if self.client:
            doc = self.client.collection("sessions").document(session_id).get()
            return Session(**doc.to_dict()) if doc.exists else None
        return None

    async def list_user_sessions(self, user_id: str) -> list[Session]:
        if self.client:
            docs = self.client.collection("sessions").where("userId", "==", user_id).order_by("createdAt", direction=firestore.Query.DESCENDING).stream()
            return [Session(**doc.to_dict()) for doc in docs]
        return [session for session in self.sessions.values() if session.userId == user_id]

    async def add_message(self, session_id: str, role: str, content: str) -> Message:
        message = Message(id=str(uuid4()), role=role, content=content, createdAt=utc_now_iso())
        if self.client:
            session = await self.get_session(session_id)
            self.client.collection("sessions").document(session_id).collection("messages").document(message.id).set(
                {**message.model_dump(), "messageId": message.id, "sessionId": session_id, "userId": session.userId if session else None}
            )
        self.messages.setdefault(session_id, []).append(message)
        return message

    async def get_messages(self, session_id: str) -> list[Message]:
        if self.client:
            docs = self.client.collection("sessions").document(session_id).collection("messages").order_by("createdAt").stream()
            return [Message(**doc.to_dict()) for doc in docs]
        return self.messages.get(session_id, [])

    async def update_session(self, session: Session) -> Session:
        if self.client:
            self.client.collection("sessions").document(session.id).set({**session.model_dump(), "sessionId": session.id, "updatedAt": utc_now_iso()}, merge=True)
        self.sessions[session.id] = session
        return session

    async def save_report(self, report: Report) -> Report:
        if self.client:
            self.client.collection("reports").document(report.id).set({**report.model_dump(), "reportId": report.id})
        self.reports[report.id] = report
        return report

    async def get_report(self, report_id: str) -> Optional[Report]:
        if report_id in self.reports:
            return self.reports[report_id]
        if self.client:
            doc = self.client.collection("reports").document(report_id).get()
            return Report(**doc.to_dict()) if doc.exists else None
        return None

    async def get_report_by_session(self, session_id: str) -> Optional[Report]:
        for report in self.reports.values():
            if report.sessionId == session_id:
                return report
        if self.client:
            docs = self.client.collection("reports").where("sessionId", "==", session_id).limit(1).stream()
            for doc in docs:
                return Report(**doc.to_dict())
        return None

    async def save_analytics(self, analytics: PerformanceAnalytics) -> PerformanceAnalytics:
        if self.client:
            self.client.collection("analytics").document(analytics.id).set({**analytics.model_dump(), "analyticsId": analytics.id})
            for tree in analytics.decisionTrees:
                self.client.collection("reasoningTrees").document(tree.id).set({**tree.model_dump(), "treeId": tree.id, "userId": analytics.userId})
            if analytics.challengeResult:
                self.client.collection("challengeResults").document(str(analytics.challengeResult["id"])).set(
                    {
                        "userId": analytics.userId,
                        **analytics.challengeResult,
                    }
                )
            self.client.collection("historicalPerformance").document(analytics.userId).set(
                {
                    "userId": analytics.userId,
                    "latestAnalyticsId": analytics.id,
                    "rollingAverages": analytics.metrics.model_dump(),
                    "skillGrowth": analytics.progression,
                    "trendData": analytics.trendData,
                    "pressureHistory": analytics.pressureData,
                    "reasoningEvolution": analytics.reasoningMetrics,
                    "communicationEvolution": analytics.communicationMetrics,
                    "benchmarkComparisons": analytics.benchmarkMetrics,
                    "categoryPerformance": {analytics.sessionId: analytics.metrics.reasoningQuality},
                    "growthMetrics": analytics.historicalInsights,
                    "recurringWeaknesses": analytics.heatmapData,
                    "updatedAt": analytics.createdAt,
                },
                merge=True,
            )
        self.analytics[analytics.id] = analytics
        return analytics

    async def get_analytics_by_report(self, report: Report) -> Optional[PerformanceAnalytics]:
        for analytics in self.analytics.values():
            if analytics.sessionId == report.sessionId:
                return analytics
        if self.client:
            docs = self.client.collection("analytics").where("sessionId", "==", report.sessionId).limit(1).stream()
            for doc in docs:
                return PerformanceAnalytics(**doc.to_dict())
        return None

    async def create_user_profile(self, uid: str, email: Optional[str] = None, display_name: Optional[str] = None, photo_url: Optional[str] = None) -> dict:
        now = utc_now_iso()
        existing = await self.get_user_profile(uid)
        payload = {
            "uid": uid,
            "email": email or (existing or {}).get("email"),
            "displayName": display_name or (existing or {}).get("displayName"),
            "photoURL": photo_url or (existing or {}).get("photoURL"),
            "role": (existing or {}).get("role", "user"),
            "planId": (existing or {}).get("planId", "free"),
            "planName": (existing or {}).get("planName", "Free"),
            "status": (existing or {}).get("status", "active"),
            "createdAt": (existing or {}).get("createdAt", now),
            "updatedAt": now,
            "lastLoginAt": now,
        }
        if self.client:
            self.client.collection("users").document(uid).set(payload, merge=True)
        self.admin_users.setdefault(uid, {}).update(payload)
        return payload

    async def get_user_profile(self, uid: str) -> Optional[dict]:
        if self.client:
            doc = self.client.collection("users").document(uid).get()
            return doc.to_dict() if doc.exists else None
        return self.admin_users.get(uid)

    async def update_last_login(self, uid: str) -> None:
        payload = {"lastLoginAt": utc_now_iso(), "updatedAt": utc_now_iso()}
        if self.client:
            self.client.collection("users").document(uid).set(payload, merge=True)
        self.admin_users.setdefault(uid, {"uid": uid}).update(payload)

    async def get_user_sessions(self, user_id: str) -> list[Session]:
        return await self.list_user_sessions(user_id)

    async def create_report(self, report: Report) -> Report:
        return await self.save_report(report)

    async def create_analytics(self, analytics: PerformanceAnalytics) -> PerformanceAnalytics:
        return await self.save_analytics(analytics)

    async def get_user_analytics(self, user_id: str) -> list[PerformanceAnalytics]:
        if self.client:
            docs = self.client.collection("analytics").where("userId", "==", user_id).order_by("createdAt", direction=firestore.Query.DESCENDING).stream()
            return [PerformanceAnalytics(**doc.to_dict()) for doc in docs]
        return [item for item in self.analytics.values() if item.userId == user_id]

    async def get_user_entitlements(self, uid: str) -> dict:
        if self.client:
            doc = self.client.collection("userEntitlements").document(uid).get()
            if doc.exists:
                return doc.to_dict()
        profile = await self.get_user_profile(uid) or {}
        plan_id = profile.get("planId", "free")
        plan = next((item for item in await self.admin_list_plans() if item["planId"] == plan_id), DEFAULT_PLANS[0])
        return {
            "uid": uid,
            "planId": plan["planId"],
            "planName": plan["name"],
            "status": profile.get("status", "active"),
            "source": "manual",
            "entitlements": plan["entitlements"],
            "overrides": {},
            "trialEndsAt": None,
            "subscriptionId": None,
            "paddleCustomerId": None,
            "updatedAt": utc_now_iso(),
        }

    async def assign_user_plan(self, uid: str, plan_id: str, status: str = "active", source: str = "admin", overrides: Optional[dict] = None) -> dict:
        return await self.admin_assign_plan(uid, {"planId": plan_id, "status": status, "source": source, "overrides": overrides or {}})

    async def get_plans(self) -> list[dict]:
        return await self.admin_list_plans()

    async def seed_default_plans(self) -> list[dict]:
        seeded = []
        for plan in DEFAULT_PLANS:
            seeded.append(await self.admin_save_plan({**plan}))
        return seeded

    async def log_admin_action(self, admin_uid: str, action: str, target_type: str, target_id: str, before: Optional[dict] = None, after: Optional[dict] = None) -> dict:
        log_id = str(uuid4())
        payload = {
            "logId": log_id,
            "adminUid": admin_uid,
            "action": action,
            "targetType": target_type,
            "targetId": target_id,
            "before": before or {},
            "after": after or {},
            "createdAt": utc_now_iso(),
        }
        if self.client:
            self.client.collection("adminLogs").document(log_id).set(payload)
        return payload

    async def track_feature_usage(self, user_id: str, feature: str, session_id: Optional[str] = None, count: int = 1, month_key: Optional[str] = None) -> dict:
        now = utc_now_iso()
        usage_id = f"{user_id}_{feature}_{month_key or now[:7]}_{session_id or 'global'}"
        payload = {
            "usageId": usage_id,
            "userId": user_id,
            "feature": feature,
            "sessionId": session_id,
            "count": count,
            "monthKey": month_key or now[:7],
            "createdAt": now,
            "updatedAt": now,
        }
        if self.client:
            ref = self.client.collection("featureUsage").document(usage_id)
            current = ref.get()
            if current.exists:
                current_data = current.to_dict()
                payload["count"] = int(current_data.get("count", 0)) + count
                payload["createdAt"] = current_data.get("createdAt", now)
            ref.set(payload, merge=True)
        return payload

    async def create_contact_submission(self, name: str, email: str, topic: str, message: str) -> dict:
        submission_id = str(uuid4())
        payload = {
            "id": submission_id,
            "name": name,
            "email": email,
            "topic": topic,
            "message": message,
            "createdAt": utc_now_iso(),
        }
        if self.client:
            self.client.collection("contact_submissions").document(submission_id).set(payload)
        self.contact_submissions[submission_id] = payload
        return payload

    async def admin_stats(self) -> dict:
        plans = await self.admin_list_plans()
        users = await self.admin_list_users()
        return {
            "totalPlans": len(plans),
            "activeUsers": len([user for user in users if user.get("status", "active") != "disabled"]),
            "activeSubscribers": len([user for user in users if user.get("planId", "free") != "free"]),
            "pendingSubscriptions": 0,
        }

    async def admin_list_plans(self) -> list[dict]:
        if self.client:
            docs = self.client.collection("plans").stream()
            plans = [doc.to_dict() for doc in docs]
            return sorted(plans or DEFAULT_PLANS, key=lambda plan: plan.get("sortOrder", 0))
        return sorted(self.admin_plans.values(), key=lambda plan: plan.get("sortOrder", 0))

    async def admin_save_plan(self, plan: dict) -> dict:
        plan["updatedAt"] = utc_now_iso()
        plan.setdefault("createdAt", utc_now_iso())
        if self.client:
            self.client.collection("plans").document(plan["planId"]).set(plan, merge=True)
        self.admin_plans[plan["planId"]] = plan
        return plan

    async def admin_list_users(self) -> list[dict]:
        if self.client:
            docs = self.client.collection("users").stream()
            return [doc.to_dict() for doc in docs]
        return list(self.admin_users.values())

    async def admin_get_user(self, uid: str) -> Optional[dict]:
        if self.client:
            doc = self.client.collection("users").document(uid).get()
            return doc.to_dict() if doc.exists else None
        return self.admin_users.get(uid)

    async def admin_set_role(self, uid: str, role: str) -> dict:
        payload = {"uid": uid, "role": role, "updatedAt": utc_now_iso()}
        if self.client:
            self.client.collection("users").document(uid).set(payload, merge=True)
        self.admin_users.setdefault(uid, {"uid": uid}).update(payload)
        return self.admin_users.get(uid, payload)

    async def admin_assign_plan(self, uid: str, payload: dict) -> dict:
        plan_id = payload.get("planId", "free")
        plans = {plan["planId"]: plan for plan in await self.admin_list_plans()}
        plan = plans.get(plan_id, DEFAULT_PLANS[0])
        entitlements = {**plan.get("entitlements", {}), **payload.get("overrides", {})}
        assignment = {
            "uid": uid,
            "planId": plan["planId"],
            "planName": plan["name"],
            "status": payload.get("status", "active"),
            "source": payload.get("source", "admin"),
            "entitlements": entitlements,
            "overrides": payload.get("overrides", {}),
            "trialEndsAt": payload.get("trialEndsAt"),
            "subscriptionId": payload.get("subscriptionId", ""),
            "paddleCustomerId": payload.get("paddleCustomerId", ""),
            "updatedAt": utc_now_iso(),
        }
        if self.client:
            self.client.collection("userEntitlements").document(uid).set(assignment, merge=True)
            self.client.collection("users").document(uid).set({"planId": assignment["planId"], "planName": assignment["planName"], "status": assignment["status"], "updatedAt": assignment["updatedAt"]}, merge=True)
        self.admin_users.setdefault(uid, {"uid": uid}).update({"planId": assignment["planId"], "planName": assignment["planName"], "status": assignment["status"]})
        return assignment

    async def admin_billing(self) -> dict:
        return {"customers": [], "subscriptions": [], "checkouts": [], "failedPayments": [], "provider": "paddle"}
