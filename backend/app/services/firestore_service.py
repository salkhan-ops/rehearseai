from typing import Optional
from uuid import uuid4
from google.cloud import firestore
from google.api_core import exceptions as google_exceptions
from app.config import get_settings
from app.models.message import Message
from app.models.course import Achievement, Course, CourseBundle, CourseModule, CourseProgress, CourseSession, Notification, UserProgress
from app.models.practice import PracticeHistory, PracticeHistoryCreate, PracticeSchedule, PracticeScheduleCreate
from app.models.report import Report
from app.models.analytics import PerformanceAnalytics, ReasoningTree
from app.models.session import Session, SessionCreate
from app.utils.timestamps import utc_now_iso


DEFAULT_ENTITLEMENTS = {
    "maxSessionsPerMonth": 3,
    "maxMessagesPerSession": 16,
    "maxSessionMinutes": 15,
    "allowBrutalMode": False,
    "allowNerveMode": False,
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
    "allowCourseTemplates": False,
    "allowScheduledPractice": True,
    "allowBeginnerHints": True,
    "allowConversationMap": True,
    "allowLanguageSelection": True,
    "allowTeachingMode": True,
    "allowInterviewMode": True,
    "allowPresentationMode": True,
    "allowSalaryNegotiationMode": True,
    "allowDifficultConversationMode": True,
    "allowSalesPitchMode": True,
    "reportDepth": "basic",
    "historyRetentionDays": 30,
    "monthlyGeminiTokenLimit": 50000,
    "docGroundingDocsPerDay": 1,
}

DEFAULT_PLANS = [
    {"planId": "free", "slug": "free", "name": "Free", "description": "3 sessions/month, basic feedback, limited history.", "priceMonthly": 0, "priceYearly": 0, "currency": "USD", "paddleProductId": "", "paddleMonthlyPriceId": "", "paddleYearlyPriceId": "", "isActive": True, "isPublic": True, "sortOrder": 1, "entitlements": DEFAULT_ENTITLEMENTS},
    {"planId": "pro", "slug": "pro", "name": "Pro", "description": "Unlimited sessions, advanced reports, brutal mode, Nerve Mode, history, shareable reports, decision trees, and challenge mode.", "priceMonthly": 19, "priceYearly": 190, "currency": "USD", "paddleProductId": "", "paddleMonthlyPriceId": "", "paddleYearlyPriceId": "", "isActive": True, "isPublic": True, "sortOrder": 2, "entitlements": {**DEFAULT_ENTITLEMENTS, "maxSessionsPerMonth": "unlimited", "maxMessagesPerSession": 40, "maxSessionMinutes": 45, "allowBrutalMode": True, "allowNerveMode": True, "allowChallengeMode": True, "allowAdvancedAnalytics": True, "allowDecisionTree": True, "allowHistoricalTrends": True, "allowShareableReports": True, "allowReportExport": True, "allowLongitudinalMemory": True, "allowCourseTemplates": True, "reportDepth": "advanced", "historyRetentionDays": 365, "monthlyGeminiTokenLimit": 400000, "docGroundingDocsPerDay": 3}},
    {"planId": "coach", "slug": "coach", "name": "Coach", "description": "Everything in Pro plus advanced personas, benchmarking, priority features, extended history, and advanced replay intelligence.", "priceMonthly": 49, "priceYearly": 490, "currency": "USD", "paddleProductId": "", "paddleMonthlyPriceId": "", "paddleYearlyPriceId": "", "isActive": True, "isPublic": True, "sortOrder": 3, "entitlements": {**DEFAULT_ENTITLEMENTS, "maxSessionsPerMonth": "unlimited", "maxMessagesPerSession": 80, "maxSessionMinutes": 90, "allowBrutalMode": True, "allowNerveMode": True, "allowChallengeMode": True, "allowAdvancedAnalytics": True, "allowDecisionTree": True, "allowHistoricalTrends": True, "allowBenchmarking": True, "allowShareableReports": True, "allowReportExport": True, "allowLongitudinalMemory": True, "allowCustomPersonas": True, "allowCourseTemplates": True, "reportDepth": "coach", "historyRetentionDays": "unlimited", "monthlyGeminiTokenLimit": 1200000, "docGroundingDocsPerDay": "unlimited"}},
]

DEFAULT_PRODUCTS = [
    {"productId": "free-interview-practice", "title": "Free Interview Practice", "slug": "free-interview-practice", "description": "Starter interview rehearsal with basic feedback.", "category": "practice", "linkedPlanId": "free", "linkedTemplateId": "", "priceDisplay": "$0", "badgeText": "Starter", "isFeatured": False, "isPublic": True, "sortOrder": 1, "heroText": "Practice your first interview loop.", "benefits": ["3 sessions/month", "Basic feedback"], "limitations": ["Limited reports"], "ctaText": "Start free", "ctaUrl": "/practice",},
    {"productId": "pro-interview-pressure-training", "title": "Pro Interview Pressure Training", "slug": "pro-interview-pressure-training", "description": "Adaptive interview pressure with advanced analytics.", "category": "practice", "linkedPlanId": "pro", "linkedTemplateId": "job-interview-product-manager", "priceDisplay": "$19/mo", "badgeText": "Popular", "isFeatured": True, "isPublic": True, "sortOrder": 2, "heroText": "Train under realistic pressure.", "benefits": ["Unlimited sessions", "Advanced reports", "Brutal mode"], "limitations": [], "ctaText": "Upgrade to Pro", "ctaUrl": "/pricing",},
    {"productId": "reasoning-under-pressure-30", "title": "30-Day Reasoning Under Pressure", "slug": "reasoning-under-pressure-30", "description": "A structured course for calm, evidence-backed reasoning.", "category": "course", "linkedPlanId": "coach", "linkedTemplateId": "reasoning-under-pressure-30", "priceDisplay": "$49/mo", "badgeText": "Coach", "isFeatured": True, "isPublic": True, "sortOrder": 3, "heroText": "Build durable reasoning under pressure.", "benefits": ["Daily missions", "Progressive pressure", "Reasoning map"], "limitations": [], "ctaText": "Open course", "ctaUrl": "/courses",},
]

DEFAULT_PRACTICE_TEMPLATES = [
    {"templateId": "job-interview-product-manager", "title": "Job Interview: Product Manager", "slug": "job-interview-product-manager", "category": "interview", "practiceType": "Job Interview", "difficulty": "Intermediate", "description": "Product strategy and execution interview rehearsal.", "scenarioPrompt": "Ask product judgment, prioritization, and tradeoff questions.", "beginnerBriefingEnabled": True, "conversationMapEnabled": True, "hintsEnabled": True, "defaultDurationMinutes": 20, "isPublic": True, "isActive": True, "sortOrder": 1, "requiredEntitlements": ["allowInterviewMode"]},
    {"templateId": "brutal-panel-discussion", "title": "Brutal Panel Discussion", "slug": "brutal-panel-discussion", "category": "panel", "practiceType": "Panel Discussion", "difficulty": "Brutal", "description": "High-friction panel practice with interruptions.", "scenarioPrompt": "Simulate multiple skeptical panelists.", "beginnerBriefingEnabled": False, "conversationMapEnabled": False, "hintsEnabled": False, "defaultDurationMinutes": 30, "isPublic": True, "isActive": True, "sortOrder": 2, "requiredEntitlements": ["allowBrutalMode"]},
    {"templateId": "salary-negotiation", "title": "Salary Negotiation", "slug": "salary-negotiation", "category": "negotiation", "practiceType": "Salary Negotiation", "difficulty": "Advanced", "description": "Compensation negotiation with pushback.", "scenarioPrompt": "Challenge value claims and ask for evidence.", "beginnerBriefingEnabled": False, "conversationMapEnabled": False, "hintsEnabled": False, "defaultDurationMinutes": 20, "isPublic": True, "isActive": True, "sortOrder": 3, "requiredEntitlements": ["allowSalaryNegotiationMode"]},
]

DEFAULT_COURSE_TEMPLATES = [
    {"templateId": "interview-pressure-sprint-7", "title": "7-Day Interview Pressure Sprint", "slug": "interview-pressure-sprint-7", "category": "interview", "durationDays": 7, "durationLabel": "7 days", "frequency": "daily", "dailyMinutes": 20, "difficulty": "Intermediate", "targetSkills": ["clarity", "evidence", "composure"], "description": "A short sprint for sharper interview answers.", "expectedTransformation": "More direct, evidence-backed answers.", "schedulePattern": "daily", "milestones": ["Opening answer", "Evidence", "Objections"], "requiredEntitlements": ["allowInterviewMode"], "isPublic": True, "isActive": True, "sortOrder": 1},
    {"templateId": "public-speaking-confidence-14", "title": "14-Day Public Speaking Confidence Builder", "slug": "public-speaking-confidence-14", "category": "presentation", "durationDays": 14, "durationLabel": "14 days", "frequency": "daily", "dailyMinutes": 15, "difficulty": "Beginner", "targetSkills": ["structure", "confidence", "conciseness"], "description": "Build speaking confidence with guided scaffolding.", "expectedTransformation": "Calmer, clearer presentation delivery.", "schedulePattern": "daily", "milestones": ["Structure", "Audience questions", "Recovery"], "requiredEntitlements": ["allowPresentationMode"], "isPublic": True, "isActive": True, "sortOrder": 2},
    {"templateId": "reasoning-under-pressure-30", "title": "30-Day Reasoning Under Pressure", "slug": "reasoning-under-pressure-30", "category": "reasoning", "durationDays": 30, "durationLabel": "30 days", "frequency": "daily", "dailyMinutes": 20, "difficulty": "Advanced", "targetSkills": ["reasoning", "objections", "judgment"], "description": "Progressive pressure missions for resilient reasoning.", "expectedTransformation": "Better structured thinking under challenge.", "schedulePattern": "daily", "milestones": ["Baseline", "Challenge", "Mastery"], "requiredEntitlements": ["allowCourseTemplates"], "isPublic": True, "isActive": True, "sortOrder": 3},
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
        self.contact_messages: dict[str, dict] = {}
        self.practice_schedules: dict[str, PracticeSchedule] = {}
        self.practice_history: dict[str, PracticeHistory] = {}
        self.courses: dict[str, Course] = {}
        self.course_modules: dict[str, CourseModule] = {}
        self.course_sessions: dict[str, CourseSession] = {}
        self.course_progress: dict[str, CourseProgress] = {}
        self.notifications: dict[str, Notification] = {}
        self.user_progress: dict[str, UserProgress] = {}
        self.achievements: dict[str, Achievement] = {}
        self.billing_subscriptions: dict[str, dict] = {}
        self.voice_profiles: dict[str, dict] = {}
        self.conversation_states: dict[str, dict] = {}
        self.conversation_dynamics: dict[str, dict] = {}
        self.conversation_telemetry: dict[str, dict] = {}
        self.conversation_turn_timing: dict[str, dict] = {}
        self.local_signal_telemetry: dict[str, dict] = {}
        self.session_outcomes: dict[str, dict] = {}
        self.telemetry_labels: dict[str, dict] = {}
        self.safety_events: dict[str, dict] = {}
        self.session_analysis: dict[str, dict] = {}
        self.session_hints: dict[str, dict] = {}
        self.admin_products: dict[str, dict] = {item["productId"]: item for item in DEFAULT_PRODUCTS}
        self.admin_practice_templates: dict[str, dict] = {item["templateId"]: item for item in DEFAULT_PRACTICE_TEMPLATES}
        self.admin_course_templates: dict[str, dict] = {item["templateId"]: item for item in DEFAULT_COURSE_TEMPLATES}
        self.admin_logs: dict[str, dict] = {}
        self.doc_counters: dict[str, dict] = {}
        self.session_counters: dict[str, dict] = {}

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

    async def add_message(self, session_id: str, role: str, content: str, metadata: Optional[dict] = None) -> Message:
        message = Message(id=str(uuid4()), role=role, content=content, createdAt=utc_now_iso(), metadata=metadata)
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

    async def save_session_analysis(self, analysis: dict) -> dict:
        analysis_id = analysis["analysisId"]
        if self.client:
            self.client.collection("sessionAnalysis").document(analysis_id).set(analysis, merge=True)
        self.session_analysis[analysis_id] = analysis
        return analysis

    async def get_session_analysis(self, analysis_id: str) -> Optional[dict]:
        if analysis_id in self.session_analysis:
            return self.session_analysis[analysis_id]
        if self.client:
            doc = self.client.collection("sessionAnalysis").document(analysis_id).get()
            return doc.to_dict() if doc.exists else None
        return None

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
            "privacySettings": (existing or {}).get("privacySettings", {
                "allowTelemetry": True,
                "allowModelImprovement": True,
                "allowRawAudioStorage": False,
                "allowCameraAssistedTiming": False,
                "allowLocalSignalTelemetry": False,
                "allowRawVideoStorage": False,
            }),
            "ageConfirmed": (existing or {}).get("ageConfirmed", False),
            "minorConsentAcknowledged": (existing or {}).get("minorConsentAcknowledged", False),
            "termsAcceptedAt": (existing or {}).get("termsAcceptedAt"),
            "privacyAcceptedAt": (existing or {}).get("privacyAcceptedAt"),
            "ageConfirmedAt": (existing or {}).get("ageConfirmedAt"),
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

    async def get_user_privacy_settings(self, uid: str) -> dict:
        defaults = {
            "allowTelemetry": True,
            "allowModelImprovement": True,
            "allowRawAudioStorage": False,
            "allowCameraAssistedTiming": False,
            "allowLocalSignalTelemetry": False,
            "allowRawVideoStorage": False,
        }
        profile = await self.get_user_profile(uid) or {}
        return {**defaults, **(profile.get("privacySettings") or {})}

    async def update_user_privacy_settings(self, uid: str, settings: dict) -> dict:
        current = await self.get_user_privacy_settings(uid)
        next_settings = {
            "allowTelemetry": bool(settings["allowTelemetry"]) if "allowTelemetry" in settings else current["allowTelemetry"],
            "allowModelImprovement": bool(settings["allowModelImprovement"]) if "allowModelImprovement" in settings else current["allowModelImprovement"],
            "allowRawAudioStorage": bool(settings["allowRawAudioStorage"]) if "allowRawAudioStorage" in settings else current["allowRawAudioStorage"],
            "allowCameraAssistedTiming": bool(settings["allowCameraAssistedTiming"]) if "allowCameraAssistedTiming" in settings else current["allowCameraAssistedTiming"],
            "allowLocalSignalTelemetry": bool(settings["allowLocalSignalTelemetry"]) if "allowLocalSignalTelemetry" in settings else current["allowLocalSignalTelemetry"],
            "allowRawVideoStorage": False,
        }
        payload = {"privacySettings": next_settings, "updatedAt": utc_now_iso()}
        if self.client:
            self.client.collection("users").document(uid).set(payload, merge=True)
        self.admin_users.setdefault(uid, {"uid": uid}).update(payload)
        return next_settings

    async def update_last_login(self, uid: str) -> None:
        payload = {"lastLoginAt": utc_now_iso(), "updatedAt": utc_now_iso()}
        if self.client:
            self.client.collection("users").document(uid).set(payload, merge=True)
        self.admin_users.setdefault(uid, {"uid": uid}).update(payload)

    async def soft_delete_user(self, uid: str, reason: Optional[str] = None) -> dict:
        payload = {
            "deletionRequestedAt": utc_now_iso(),
            "deletedAt": utc_now_iso(),
            "status": "disabled",
            "deletionReason": reason or "",
            "updatedAt": utc_now_iso(),
        }
        if self.client:
            self.client.collection("users").document(uid).set(payload, merge=True)
        self.admin_users.setdefault(uid, {"uid": uid}).update(payload)
        return self.admin_users.get(uid, {"uid": uid, **payload})

    async def get_current_subscription(self, uid: str) -> dict:
        if self.client:
            docs = self.client.collection("billing_subscriptions").where("uid", "==", uid).limit(1).stream()
            for doc in docs:
                return doc.to_dict()
        for subscription in self.billing_subscriptions.values():
            if subscription.get("uid") == uid:
                return subscription
        entitlements = await self.get_user_entitlements(uid)
        return {
            "subscriptionId": entitlements.get("subscriptionId") or f"mock_{uid}",
            "uid": uid,
            "paddleSubscriptionId": entitlements.get("subscriptionId") or "",
            "status": entitlements.get("status", "active"),
            "currentPeriodStart": utc_now_iso(),
            "currentPeriodEnd": None,
            "cancelAtPeriodEnd": False,
            "cancelledAt": None,
            "planId": entitlements.get("planId", "free"),
            "planName": entitlements.get("planName", "Free"),
            "createdAt": utc_now_iso(),
            "updatedAt": utc_now_iso(),
        }

    async def update_subscription_status(self, uid: str, cancel_at_period_end: bool, reason: Optional[str] = None) -> dict:
        current = await self.get_current_subscription(uid)
        subscription_id = current.get("subscriptionId") or current.get("paddleSubscriptionId") or f"mock_{uid}"
        payload = {
            **current,
            "subscriptionId": subscription_id,
            "uid": uid,
            "cancelAtPeriodEnd": cancel_at_period_end,
            "cancelledAt": utc_now_iso() if cancel_at_period_end else None,
            "cancellationReason": reason or current.get("cancellationReason", ""),
            "status": "cancelled" if cancel_at_period_end else "active",
            "updatedAt": utc_now_iso(),
        }
        if self.client:
            self.client.collection("billing_subscriptions").document(subscription_id).set(payload, merge=True)
            self.client.collection("userEntitlements").document(uid).set({"status": payload["status"], "updatedAt": payload["updatedAt"]}, merge=True)
        self.billing_subscriptions[subscription_id] = payload
        return payload

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

    async def save_voice_profile(self, profile: dict) -> dict:
        user_id = profile["userId"]
        existing = await self.get_voice_profile(user_id) or {}
        merged = {**existing, **profile}
        if self.client:
            self.client.collection("voiceProfiles").document(user_id).set(merged, merge=True)
        self.voice_profiles[user_id] = merged
        return merged

    async def get_voice_profile(self, user_id: str) -> Optional[dict]:
        if user_id in self.voice_profiles:
            return self.voice_profiles[user_id]
        if self.client:
            doc = self.client.collection("voiceProfiles").document(user_id).get()
            return doc.to_dict() if doc.exists else None
        return None

    async def save_conversation_turn_timing(self, timing: dict) -> dict:
        timing_id = timing["timingId"]
        if self.client:
            self.client.collection("conversationTurnTiming").document(timing_id).set(timing, merge=True)
        self.conversation_turn_timing[timing_id] = timing
        return timing

    async def save_conversation_state(self, session_id: str, user_id: str, state: dict) -> dict:
        state_id = f"{session_id}_{user_id}"
        payload = {
            "id": state_id,
            "sessionId": session_id,
            "userId": user_id,
            "conversationState": state,
            "updatedAt": utc_now_iso(),
        }
        if self.client:
            self.client.collection("conversationStates").document(state_id).set(payload, merge=True)
        self.conversation_states[state_id] = payload
        return payload

    async def save_conversation_dynamics(self, record: dict) -> dict:
        dynamics_id = record["dynamicsId"]
        if self.client:
            self.client.collection("conversationDynamics").document(dynamics_id).set(record, merge=True)
        self.conversation_dynamics[dynamics_id] = record
        return record

    async def list_conversation_dynamics(self, user_id: Optional[str] = None, session_id: Optional[str] = None, limit_count: int = 100) -> list[dict]:
        if self.client:
            try:
                query = self.client.collection("conversationDynamics")
                if user_id:
                    query = query.where("userId", "==", user_id)
                if session_id:
                    query = query.where("sessionId", "==", session_id)
                docs = query.order_by("createdAt", direction=firestore.Query.ASCENDING).limit(limit_count).stream()
                return [doc.to_dict() for doc in docs]
            except google_exceptions.FailedPrecondition:
                return []
        records = list(self.conversation_dynamics.values())
        if user_id:
            records = [record for record in records if record.get("userId") == user_id]
        if session_id:
            records = [record for record in records if record.get("sessionId") == session_id]
        return sorted(records, key=lambda item: item.get("createdAt", ""))[:limit_count]

    async def save_conversation_telemetry(self, record: dict) -> dict:
        telemetry_id = record["telemetryId"]
        if self.client:
            self.client.collection("conversationTelemetry").document(telemetry_id).set(record, merge=True)
        self.conversation_telemetry[telemetry_id] = record
        return record

    async def list_conversation_telemetry(self, user_id: Optional[str] = None, session_id: Optional[str] = None, limit_count: int = 100) -> list[dict]:
        if self.client:
            try:
                query = self.client.collection("conversationTelemetry")
                if user_id:
                    query = query.where("userId", "==", user_id)
                if session_id:
                    query = query.where("sessionId", "==", session_id)
                docs = query.order_by("createdAt", direction=firestore.Query.DESCENDING).limit(limit_count).stream()
                return [doc.to_dict() for doc in docs]
            except google_exceptions.FailedPrecondition:
                return []
        records = list(self.conversation_telemetry.values())
        if user_id:
            records = [record for record in records if record.get("userId") == user_id]
        if session_id:
            records = [record for record in records if record.get("sessionId") == session_id]
        return sorted(records, key=lambda item: item.get("createdAt", ""), reverse=True)[:limit_count]

    async def save_local_signal_telemetry(self, record: dict) -> dict:
        telemetry_id = record["telemetryId"]
        if self.client:
            self.client.collection("localSignalTelemetry").document(telemetry_id).set(record, merge=True)
        self.local_signal_telemetry[telemetry_id] = record
        return record

    async def list_local_signal_telemetry(self, limit_count: int = 500) -> list[dict]:
        if self.client:
            docs = self.client.collection("localSignalTelemetry").order_by("createdAt", direction=firestore.Query.DESCENDING).limit(limit_count).stream()
            return [doc.to_dict() for doc in docs]
        return sorted(self.local_signal_telemetry.values(), key=lambda item: item.get("createdAt", ""), reverse=True)[:limit_count]

    async def count_local_signal_opt_outs(self) -> int:
        if self.client:
            docs = self.client.collection("users").where("privacySettings.allowLocalSignalTelemetry", "==", False).stream()
            return sum(1 for _ in docs)
        return sum(
            1
            for profile in self.admin_users.values()
            if not (profile.get("privacySettings") or {}).get("allowLocalSignalTelemetry", False)
        )

    async def cleanup_expired_conversation_telemetry(self, now_iso: Optional[str] = None, limit_count: int = 500) -> int:
        cutoff = now_iso or utc_now_iso()
        deleted = 0
        if self.client:
            docs = self.client.collection("conversationTelemetry").where("expiresAt", "<=", cutoff).limit(limit_count).stream()
            for doc in docs:
                doc.reference.delete()
                deleted += 1
            return deleted
        expired_ids = [
            telemetry_id
            for telemetry_id, record in self.conversation_telemetry.items()
            if record.get("expiresAt") and str(record.get("expiresAt")) <= cutoff
        ][:limit_count]
        for telemetry_id in expired_ids:
            self.conversation_telemetry.pop(telemetry_id, None)
            deleted += 1
        return deleted

    async def save_session_outcome(self, outcome: dict) -> dict:
        outcome_id = outcome["outcomeId"]
        if self.client:
            self.client.collection("sessionOutcomes").document(outcome_id).set(outcome, merge=True)
        self.session_outcomes[outcome_id] = outcome
        return outcome

    async def save_telemetry_label(self, label: dict) -> dict:
        label_id = label["labelId"]
        if self.client:
            self.client.collection("telemetryLabels").document(label_id).set(label, merge=True)
        self.telemetry_labels[label_id] = label
        return label

    async def list_telemetry_labels(self, telemetry_id: Optional[str] = None, limit_count: int = 100) -> list[dict]:
        if self.client:
            query = self.client.collection("telemetryLabels")
            if telemetry_id:
                query = query.where("telemetryId", "==", telemetry_id)
            docs = query.order_by("createdAt", direction=firestore.Query.DESCENDING).limit(limit_count).stream()
            return [doc.to_dict() for doc in docs]
        labels = list(self.telemetry_labels.values())
        if telemetry_id:
            labels = [label for label in labels if label.get("telemetryId") == telemetry_id]
        return sorted(labels, key=lambda item: item.get("createdAt", ""), reverse=True)[:limit_count]

    async def save_safety_event(self, event: dict) -> dict:
        event_id = event["eventId"]
        if self.client:
            self.client.collection("safetyEvents").document(event_id).set(event, merge=True)
        self.safety_events[event_id] = event
        return event

    async def list_safety_events(self, category: Optional[str] = None, risk_level: Optional[str] = None, limit_count: int = 100) -> list[dict]:
        if self.client:
            query = self.client.collection("safetyEvents")
            if category:
                if category == "crisis":
                    query = query.where("safetyAction", "==", "CRISIS_RESPONSE")
                elif category == "scope":
                    query = query.where("safetyAction", "in", ["REDIRECT", "LIMITED_RESPONSE"])
                elif category == "dependency":
                    query = query.where("domain", "==", "dependency")
                else:
                    query = query.where("domain", "==", category)
            if risk_level:
                query = query.where("riskLevel", "==", risk_level)
            docs = query.order_by("createdAt", direction=firestore.Query.DESCENDING).limit(limit_count).stream()
            return [doc.to_dict() for doc in docs]
        events = list(self.safety_events.values())
        if category:
            if category == "crisis":
                events = [event for event in events if event.get("safetyAction") == "CRISIS_RESPONSE"]
            elif category == "scope":
                events = [event for event in events if event.get("safetyAction") in {"REDIRECT", "LIMITED_RESPONSE"}]
            elif category == "dependency":
                events = [event for event in events if event.get("domain") == "dependency"]
            else:
                events = [event for event in events if event.get("domain") == category]
        if risk_level:
            events = [event for event in events if event.get("riskLevel") == risk_level]
        return sorted(events, key=lambda item: item.get("createdAt", ""), reverse=True)[:limit_count]

    async def safety_event_stats(self) -> dict:
        events = await self.list_safety_events(limit_count=500)
        return {
            "total": len(events),
            "crisis": sum(1 for event in events if event.get("safetyAction") == "CRISIS_RESPONSE"),
            "scopeViolations": sum(1 for event in events if event.get("safetyAction") in {"REDIRECT", "LIMITED_RESPONSE"}),
            "dependencyIndicators": sum(1 for event in events if event.get("domain") == "dependency"),
            "blocked": sum(1 for event in events if event.get("safetyAction") == "BLOCK"),
        }

    async def save_session_hint(self, hint: dict) -> dict:
        hint_id = hint["hintId"]
        if self.client:
            self.client.collection("sessionHints").document(hint_id).set(hint, merge=True)
        self.session_hints[hint_id] = hint
        return hint

    async def list_session_hints(self, session_id: str, user_id: Optional[str] = None) -> list[dict]:
        if self.client:
            query = self.client.collection("sessionHints").where("sessionId", "==", session_id)
            if user_id:
                query = query.where("userId", "==", user_id)
            docs = query.order_by("createdAt", direction=firestore.Query.ASCENDING).stream()
            return [doc.to_dict() for doc in docs]
        hints = [hint for hint in self.session_hints.values() if hint.get("sessionId") == session_id]
        if user_id:
            hints = [hint for hint in hints if hint.get("userId") == user_id]
        return sorted(hints, key=lambda item: item.get("createdAt", ""))

    async def user_hint_summary(self, user_id: str) -> dict:
        if self.client:
            docs = self.client.collection("sessionHints").where("userId", "==", user_id).stream()
            hints = [doc.to_dict() for doc in docs]
        else:
            hints = [hint for hint in self.session_hints.values() if hint.get("userId") == user_id]
        total = len(hints)
        viewed = sum(1 for hint in hints if hint.get("wasViewed"))
        expanded = sum(1 for hint in hints if hint.get("wasExpanded"))
        high_urgency = sum(1 for hint in hints if hint.get("urgency") == "high")
        followed_rate = round((viewed / total) * 100) if total else 0
        dependency = "low"
        if total >= 18 and expanded / max(total, 1) > 0.45:
            dependency = "watch"
        if total >= 30 and expanded / max(total, 1) > 0.6:
            dependency = "high"
        return {
            "hintsReceived": total,
            "hintsViewed": viewed,
            "hintsExpanded": expanded,
            "hintsFollowedRate": followed_rate,
            "reasoningImprovement": "building" if total else "not_started",
            "coachingDependency": dependency,
            "highUrgencyHints": high_urgency,
        }

    async def update_session_hint(self, hint_id: str, updates: dict) -> Optional[dict]:
        payload = {**updates, "updatedAt": utc_now_iso()}
        if self.client:
            ref = self.client.collection("sessionHints").document(hint_id)
            current = ref.get()
            if not current.exists:
                return None
            ref.set(payload, merge=True)
            return {**current.to_dict(), **payload}
        if hint_id not in self.session_hints:
            return None
        self.session_hints[hint_id].update(payload)
        return self.session_hints[hint_id]

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
        self.admin_logs[log_id] = payload
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

    async def create_contact_message(self, name: str, email: str, category: str, subject: str, message: str, user_id: Optional[str] = None) -> dict:
        message_id = str(uuid4())
        now = utc_now_iso()
        payload = {
            "id": message_id,
            "messageId": message_id,
            "name": name,
            "email": email,
            "userId": user_id,
            "category": category,
            "subject": subject,
            "message": message,
            "status": "new",
            "createdAt": now,
            "updatedAt": now,
        }
        if self.client:
            self.client.collection("contactMessages").document(message_id).set(payload)
        self.contact_messages[message_id] = payload
        return payload

    async def list_contact_messages(self, category: Optional[str] = None, status: Optional[str] = None) -> list[dict]:
        if self.client:
            query = self.client.collection("contactMessages")
            if category:
                query = query.where("category", "==", category)
            if status:
                query = query.where("status", "==", status)
            docs = query.stream()
            messages = [doc.to_dict() for doc in docs]
        else:
            messages = list(self.contact_messages.values())
            if category:
                messages = [message for message in messages if message.get("category") == category]
            if status:
                messages = [message for message in messages if message.get("status") == status]
        return sorted(messages, key=lambda item: item.get("createdAt", ""), reverse=True)

    async def update_contact_message_status(self, message_id: str, status: str) -> Optional[dict]:
        payload = {"status": status, "updatedAt": utc_now_iso()}
        if self.client:
            ref = self.client.collection("contactMessages").document(message_id)
            current = ref.get()
            if not current.exists:
                return None
            ref.set(payload, merge=True)
            return {**current.to_dict(), **payload}
        if message_id not in self.contact_messages:
            return None
        self.contact_messages[message_id].update(payload)
        return self.contact_messages[message_id]

    async def create_practice_schedule(self, payload: PracticeScheduleCreate) -> PracticeSchedule:
        now = utc_now_iso()
        schedule = PracticeSchedule(id=str(uuid4()), createdAt=now, updatedAt=now, **payload.model_dump())
        if self.client:
            self.client.collection("practiceSchedules").document(schedule.id).set({**schedule.model_dump(), "scheduleId": schedule.id})
        self.practice_schedules[schedule.id] = schedule
        return schedule

    async def update_practice_schedule(self, schedule_id: str, updates: dict) -> Optional[PracticeSchedule]:
        schedule = await self.get_practice_schedule(schedule_id)
        if not schedule:
            return None
        data = {**schedule.model_dump(), **{key: value for key, value in updates.items() if value is not None}, "updatedAt": utc_now_iso()}
        next_schedule = PracticeSchedule(**data)
        if self.client:
            self.client.collection("practiceSchedules").document(schedule_id).set({**next_schedule.model_dump(), "scheduleId": schedule_id}, merge=True)
        self.practice_schedules[schedule_id] = next_schedule
        return next_schedule

    async def get_practice_schedule(self, schedule_id: str) -> Optional[PracticeSchedule]:
        if schedule_id in self.practice_schedules:
            return self.practice_schedules[schedule_id]
        if self.client:
            doc = self.client.collection("practiceSchedules").document(schedule_id).get()
            return PracticeSchedule(**doc.to_dict()) if doc.exists else None
        return None

    async def list_practice_schedules(self, user_id: str) -> list[PracticeSchedule]:
        if self.client:
            docs = self.client.collection("practiceSchedules").where("userId", "==", user_id).stream()
            return [PracticeSchedule(**doc.to_dict()) for doc in docs]
        return [schedule for schedule in self.practice_schedules.values() if schedule.userId == user_id]

    async def create_practice_history(self, payload: PracticeHistoryCreate) -> PracticeHistory:
        now = utc_now_iso()
        history = PracticeHistory(
            id=str(uuid4()),
            createdAt=now,
            completedAt=now if payload.completed else None,
            **payload.model_dump(),
        )
        if self.client:
            self.client.collection("practiceHistory").document(history.id).set({**history.model_dump(), "historyId": history.id})
        self.practice_history[history.id] = history
        return history

    async def list_practice_history(self, user_id: str) -> list[PracticeHistory]:
        if self.client:
            docs = self.client.collection("practiceHistory").where("userId", "==", user_id).stream()
            return [PracticeHistory(**doc.to_dict()) for doc in docs]
        return [history for history in self.practice_history.values() if history.userId == user_id]

    async def save_course_bundle(self, bundle: CourseBundle) -> CourseBundle:
        if self.client:
            self.client.collection("courses").document(bundle.course.id).set({**bundle.course.model_dump(), "courseId": bundle.course.id})
            for module in bundle.modules:
                self.client.collection("courseModules").document(module.id).set({**module.model_dump(), "moduleId": module.id})
            for session in bundle.sessions:
                self.client.collection("courseSessions").document(session.id).set({**session.model_dump(), "courseSessionId": session.id})
            self.client.collection("courseProgress").document(bundle.progress.id).set({**bundle.progress.model_dump(), "progressId": bundle.progress.id})
        self.courses[bundle.course.id] = bundle.course
        for module in bundle.modules:
            self.course_modules[module.id] = module
        for session in bundle.sessions:
            self.course_sessions[session.id] = session
        self.course_progress[bundle.progress.id] = bundle.progress
        return bundle

    async def update_course(self, course: Course) -> Course:
        if self.client:
            self.client.collection("courses").document(course.id).set({**course.model_dump(), "courseId": course.id}, merge=True)
        self.courses[course.id] = course
        return course

    async def list_user_courses(self, user_id: str) -> list[Course]:
        if self.client:
            docs = self.client.collection("courses").where("userId", "==", user_id).stream()
            courses = [Course(**doc.to_dict()) for doc in docs]
        else:
            courses = [course for course in self.courses.values() if course.userId == user_id]
        return sorted(courses, key=lambda item: item.createdAt, reverse=True)

    async def get_course(self, course_id: str) -> Optional[Course]:
        if course_id in self.courses:
            return self.courses[course_id]
        if self.client:
            doc = self.client.collection("courses").document(course_id).get()
            return Course(**doc.to_dict()) if doc.exists else None
        return None

    async def list_course_modules(self, course_id: str) -> list[CourseModule]:
        if self.client:
            docs = self.client.collection("courseModules").where("courseId", "==", course_id).stream()
            modules = [CourseModule(**doc.to_dict()) for doc in docs]
        else:
            modules = [module for module in self.course_modules.values() if module.courseId == course_id]
        return sorted(modules, key=lambda item: item.order)

    async def list_course_sessions(self, course_id: str) -> list[CourseSession]:
        if self.client:
            docs = self.client.collection("courseSessions").where("courseId", "==", course_id).stream()
            sessions = [CourseSession(**doc.to_dict()) for doc in docs]
        else:
            sessions = [session for session in self.course_sessions.values() if session.courseId == course_id]
        return sorted(sessions, key=lambda item: item.scheduledDate)

    async def update_course_session(self, course_session: CourseSession) -> CourseSession:
        if self.client:
            self.client.collection("courseSessions").document(course_session.id).set({**course_session.model_dump(), "courseSessionId": course_session.id}, merge=True)
        self.course_sessions[course_session.id] = course_session
        return course_session

    async def get_course_session(self, course_session_id: str) -> Optional[CourseSession]:
        if course_session_id in self.course_sessions:
            return self.course_sessions[course_session_id]
        if self.client:
            doc = self.client.collection("courseSessions").document(course_session_id).get()
            return CourseSession(**doc.to_dict()) if doc.exists else None
        return None

    async def get_course_progress(self, course_id: str, user_id: str) -> Optional[CourseProgress]:
        if self.client:
            docs = self.client.collection("courseProgress").where("courseId", "==", course_id).where("userId", "==", user_id).limit(1).stream()
            for doc in docs:
                return CourseProgress(**doc.to_dict())
        for progress in self.course_progress.values():
            if progress.courseId == course_id and progress.userId == user_id:
                return progress
        return None

    async def get_course_bundle(self, course_id: str) -> Optional[CourseBundle]:
        course = await self.get_course(course_id)
        if not course:
            return None
        modules = await self.list_course_modules(course_id)
        sessions = await self.list_course_sessions(course_id)
        progress = await self.get_course_progress(course_id, course.userId)
        if not progress:
            progress = CourseProgress(id=str(uuid4()), userId=course.userId, courseId=course.id, totalSessions=len(sessions), updatedAt=utc_now_iso())
        return CourseBundle(course=course, modules=modules, sessions=sessions, progress=progress)

    async def complete_course_session(self, course_session_id: str, session_id: Optional[str] = None) -> Optional[CourseSession]:
        course_session = await self.get_course_session(course_session_id)
        if not course_session:
            return None
        completed = CourseSession(**{**course_session.model_dump(), "completed": True, "status": "completed", "completedAt": utc_now_iso(), "sessionId": session_id})
        if self.client:
            self.client.collection("courseSessions").document(course_session_id).set({**completed.model_dump(), "courseSessionId": course_session_id, "rehearsalSessionId": session_id}, merge=True)
        self.course_sessions[course_session_id] = completed
        progress = await self.get_course_progress(completed.courseId, completed.userId)
        if progress:
            next_progress = CourseProgress(**{
                **progress.model_dump(),
                "completedSessions": min(progress.totalSessions, progress.completedSessions + 1),
                "streak": progress.streak + 1,
                "lastCompletedAt": completed.completedAt,
                "updatedAt": utc_now_iso(),
                "growthMetrics": {
                    **progress.growthMetrics,
                    "reasoning": min(100, int(progress.growthMetrics.get("reasoning", 0)) + 4),
                    "pressureResilience": min(100, int(progress.growthMetrics.get("pressureResilience", 0)) + 3),
                    "clarity": min(100, int(progress.growthMetrics.get("clarity", 0)) + 3),
                    "composure": min(100, int(progress.growthMetrics.get("composure", 0)) + 3),
                },
            })
            if self.client:
                self.client.collection("courseProgress").document(next_progress.id).set({**next_progress.model_dump(), "progressId": next_progress.id}, merge=True)
            self.course_progress[next_progress.id] = next_progress
            course = await self.get_course(completed.courseId)
            if course:
                percent = round((next_progress.completedSessions / max(1, next_progress.totalSessions)) * 100)
                await self.update_course(Course(**{**course.model_dump(), "progressPercent": percent, "status": "completed" if percent >= 100 else course.status, "updatedAt": utc_now_iso()}))
        return completed

    async def create_notification(self, notification: Notification) -> Notification:
        if self.client:
            self.client.collection("notifications").document(notification.id).set({**notification.model_dump(), "notificationId": notification.id})
        self.notifications[notification.id] = notification
        return notification

    async def list_notifications(self, user_id: str) -> list[Notification]:
        if self.client:
            docs = self.client.collection("notifications").where("userId", "==", user_id).stream()
            notifications = [Notification(**doc.to_dict()) for doc in docs]
        else:
            notifications = [item for item in self.notifications.values() if item.userId == user_id]
        return sorted(notifications, key=lambda item: item.createdAt, reverse=True)

    async def mark_notification_read(self, notification_id: str, user_id: str) -> Optional[Notification]:
        notification = self.notifications.get(notification_id)
        if self.client and not notification:
            doc = self.client.collection("notifications").document(notification_id).get()
            notification = Notification(**doc.to_dict()) if doc.exists else None
        if not notification or notification.userId != user_id:
            return None
        updated = Notification(**{**notification.model_dump(), "read": True})
        if self.client:
            self.client.collection("notifications").document(notification_id).set({"read": True}, merge=True)
        self.notifications[notification_id] = updated
        return updated

    async def get_user_progress(self, uid: str) -> UserProgress:
        if self.client:
            doc = self.client.collection("userProgress").document(uid).get()
            if doc.exists:
                return UserProgress(**doc.to_dict())
        progress = self.user_progress.get(uid) or UserProgress(uid=uid, updatedAt=utc_now_iso())
        self.user_progress[uid] = progress
        return progress

    async def save_user_progress(self, progress: UserProgress) -> UserProgress:
        if self.client:
            self.client.collection("userProgress").document(progress.uid).set(progress.model_dump(), merge=True)
        self.user_progress[progress.uid] = progress
        return progress

    async def save_achievement(self, achievement: Achievement) -> Achievement:
        if self.client:
            self.client.collection("achievements").document(achievement.id).set({**achievement.model_dump(), "achievementId": achievement.id})
        self.achievements[achievement.id] = achievement
        return achievement

    async def list_achievements(self, user_id: str) -> list[Achievement]:
        if self.client:
            docs = self.client.collection("achievements").where("userId", "==", user_id).stream()
            return [Achievement(**doc.to_dict()) for doc in docs]
        return [item for item in self.achievements.values() if item.userId == user_id]

    async def admin_stats(self) -> dict:
        plans = await self.admin_list_plans()
        users = await self.admin_list_users()
        products = await self.admin_list_products()
        course_templates = await self.admin_list_course_templates()
        practice_templates = await self.admin_list_practice_templates()
        logs = await self.admin_list_logs(limit_count=500)
        return {
            "totalUsers": len(users),
            "totalPlans": len(plans),
            "activeUsers": len([user for user in users if user.get("status", "active") != "disabled"]),
            "activeSubscribers": len([user for user in users if user.get("planId", "free") != "free"]),
            "activePlans": len([plan for plan in plans if plan.get("isActive", True)]),
            "activeProducts": len([item for item in products if item.get("isPublic") and item.get("isActive", True)]),
            "activeCourseTemplates": len([item for item in course_templates if item.get("isActive", True)]),
            "activePracticeTemplates": len([item for item in practice_templates if item.get("isActive", True)]),
            "pendingSubscriptions": 0,
            "pendingBillingEvents": 0,
            "adminActionsThisWeek": len(logs),
        }

    async def admin_list_plans(self) -> list[dict]:
        if self.client:
            docs = self.client.collection("plans").stream()
            plans = [doc.to_dict() for doc in docs]
            return sorted(plans or DEFAULT_PLANS, key=lambda plan: plan.get("sortOrder", 0))
        return sorted(self.admin_plans.values(), key=lambda plan: plan.get("sortOrder", 0))

    async def admin_save_plan(self, plan: dict) -> dict:
        if "planId" not in plan:
            plan["planId"] = str(plan.get("slug") or plan.get("name", "plan")).lower().replace(" ", "-")
        plan.setdefault("slug", plan["planId"])
        plan.setdefault("isPublic", True)
        plan.setdefault("isActive", True)
        plan["updatedAt"] = utc_now_iso()
        plan.setdefault("createdAt", utc_now_iso())
        if self.client:
            self.client.collection("plans").document(plan["planId"]).set(plan, merge=True)
        self.admin_plans[plan["planId"]] = plan
        return plan

    async def admin_delete_plan(self, plan_id: str) -> dict:
        if self.client:
            self.client.collection("plans").document(plan_id).set({"isActive": False, "updatedAt": utc_now_iso()}, merge=True)
        if plan_id in self.admin_plans:
            self.admin_plans[plan_id]["isActive"] = False
        return {"planId": plan_id, "isActive": False}

    async def _admin_list_collection(self, collection_name: str, fallback: dict[str, dict]) -> list[dict]:
        if self.client:
            docs = self.client.collection(collection_name).stream()
            items = [doc.to_dict() for doc in docs]
            return sorted(items or fallback.values(), key=lambda item: item.get("sortOrder", 0))
        return sorted(fallback.values(), key=lambda item: item.get("sortOrder", 0))

    async def _admin_save_collection_item(self, collection_name: str, memory_store: dict[str, dict], id_key: str, payload: dict) -> dict:
        item_id = payload.get(id_key) or str(payload.get("slug") or payload.get("title", id_key)).lower().replace(" ", "-")
        payload[id_key] = item_id
        payload.setdefault("slug", item_id)
        payload.setdefault("isPublic", True)
        payload.setdefault("isActive", True)
        payload["updatedAt"] = utc_now_iso()
        payload.setdefault("createdAt", utc_now_iso())
        if self.client:
            self.client.collection(collection_name).document(item_id).set(payload, merge=True)
        memory_store[item_id] = payload
        return payload

    async def _admin_delete_collection_item(self, collection_name: str, memory_store: dict[str, dict], item_id: str) -> dict:
        payload = {"isActive": False, "isPublic": False, "updatedAt": utc_now_iso()}
        if self.client:
            self.client.collection(collection_name).document(item_id).set(payload, merge=True)
        if item_id in memory_store:
            memory_store[item_id].update(payload)
        return {"id": item_id, **payload}

    async def admin_list_products(self) -> list[dict]:
        return await self._admin_list_collection("products", self.admin_products)

    async def admin_save_product(self, payload: dict) -> dict:
        return await self._admin_save_collection_item("products", self.admin_products, "productId", payload)

    async def admin_delete_product(self, product_id: str) -> dict:
        return await self._admin_delete_collection_item("products", self.admin_products, product_id)

    async def admin_list_practice_templates(self) -> list[dict]:
        return await self._admin_list_collection("practiceTemplates", self.admin_practice_templates)

    async def admin_save_practice_template(self, payload: dict) -> dict:
        return await self._admin_save_collection_item("practiceTemplates", self.admin_practice_templates, "templateId", payload)

    async def admin_delete_practice_template(self, template_id: str) -> dict:
        return await self._admin_delete_collection_item("practiceTemplates", self.admin_practice_templates, template_id)

    async def admin_list_course_templates(self) -> list[dict]:
        return await self._admin_list_collection("courseTemplates", self.admin_course_templates)

    async def admin_save_course_template(self, payload: dict) -> dict:
        return await self._admin_save_collection_item("courseTemplates", self.admin_course_templates, "templateId", payload)

    async def admin_delete_course_template(self, template_id: str) -> dict:
        return await self._admin_delete_collection_item("courseTemplates", self.admin_course_templates, template_id)

    async def admin_list_logs(self, limit_count: int = 100) -> list[dict]:
        if self.client:
            docs = self.client.collection("adminLogs").order_by("createdAt", direction=firestore.Query.DESCENDING).limit(limit_count).stream()
            return [doc.to_dict() for doc in docs]
        return sorted(self.admin_logs.values(), key=lambda item: item.get("createdAt", ""), reverse=True)[:limit_count]

    async def admin_list_users(self) -> list[dict]:
        if self.client:
            docs = self.client.collection("users").stream()
            return [doc.to_dict() for doc in docs]
        return list(self.admin_users.values())

    async def admin_exists(self) -> bool:
        users = await self.admin_list_users()
        return any(user.get("role") == "admin" for user in users)

    async def admin_get_user(self, uid: str) -> Optional[dict]:
        if self.client:
            doc = self.client.collection("users").document(uid).get()
            return doc.to_dict() if doc.exists else None
        return self.admin_users.get(uid)

    async def admin_set_role(self, uid: str, role: str) -> dict:
        before = await self.admin_get_user(uid) or {}
        payload = {"uid": uid, "role": role, "updatedAt": utc_now_iso()}
        if self.client:
            self.client.collection("users").document(uid).set(payload, merge=True)
        self.admin_users.setdefault(uid, {"uid": uid}).update(payload)
        await self.log_admin_action("system", "role change", "user", uid, before=before, after=self.admin_users.get(uid, payload))
        return self.admin_users.get(uid, payload)

    async def admin_assign_plan(self, uid: str, payload: dict) -> dict:
        before = await self.admin_get_user(uid) or {}
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
        await self.log_admin_action("system", "assign plan", "user", uid, before=before, after=assignment)
        return assignment

    async def get_daily_doc_count(self, user_id: str) -> int:
        day_key = utc_now_iso()[:10]  # YYYY-MM-DD
        if self.client:
            snap = self.client.collection("userDocCounters").document(user_id).get()
            if snap.exists:
                return int(snap.to_dict().get(day_key, 0))
            return 0
        return int(self.doc_counters.get(user_id, {}).get(day_key, 0))

    async def increment_daily_doc_count(self, user_id: str) -> None:
        day_key = utc_now_iso()[:10]
        if self.client:
            ref = self.client.collection("userDocCounters").document(user_id)
            snap = ref.get()
            if snap.exists:
                ref.update({day_key: firestore.Increment(1)})
            else:
                ref.set({day_key: 1})
        else:
            user_counters = self.doc_counters.setdefault(user_id, {})
            user_counters[day_key] = user_counters.get(day_key, 0) + 1

    async def increment_monthly_session_count(self, user_id: str) -> None:
        if not user_id or user_id == "guest":
            return
        month_key = utc_now_iso()[:7]  # YYYY-MM
        if self.client:
            ref = self.client.collection("userSessionCounters").document(user_id)
            snap = ref.get()
            if snap.exists:
                ref.update({month_key: firestore.Increment(1)})
            else:
                ref.set({month_key: 1})
        else:
            user_counters = self.session_counters.setdefault(user_id, {})
            user_counters[month_key] = user_counters.get(month_key, 0) + 1

    async def cleanup_ghost_sessions(self) -> int:
        """Mark sessions with 0 turns older than 1 hour as abandoned. Returns count cleaned."""
        from datetime import datetime, timezone, timedelta
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%S")
        cleaned = 0
        if self.client:
            try:
                docs = (
                    self.client.collection("sessions")
                    .where("status", "==", "active")
                    .where("turnCount", "==", 0)
                    .stream()
                )
                for doc in docs:
                    data = doc.to_dict()
                    if data.get("createdAt", "") < cutoff:
                        doc.reference.update({"status": "abandoned", "completedAt": utc_now_iso()})
                        cleaned += 1
            except google_exceptions.FailedPrecondition:
                pass
        else:
            for session in list(self.sessions.values()):
                if session.status == "active" and session.turnCount == 0 and session.createdAt < cutoff:
                    session.status = "abandoned"
                    session.completedAt = utc_now_iso()
                    cleaned += 1
        return cleaned

    async def admin_billing(self) -> dict:
        if self.client:
            customers = [doc.to_dict() for doc in self.client.collection("billing_customers").limit(100).stream()]
            subscriptions = [doc.to_dict() for doc in self.client.collection("billing_subscriptions").limit(100).stream()]
            checkouts = [doc.to_dict() for doc in self.client.collection("billing_checkouts").limit(100).stream()]
            events = [doc.to_dict() for doc in self.client.collection("billing_events").limit(100).stream()]
            return {"customers": customers, "subscriptions": subscriptions, "checkouts": checkouts, "events": events, "failedPayments": [], "provider": "paddle"}
        return {"customers": [], "subscriptions": list(self.billing_subscriptions.values()), "checkouts": [], "events": [], "failedPayments": [], "provider": "paddle"}
