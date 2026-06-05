from uuid import uuid4
from app.models.report import Report
from app.models.session import Session
from app.services.gemini_service import GeminiService
from app.services.firestore_service import FirestoreService
from app.services.cross_examination_service import CrossExaminationService


class ReportService:
    def __init__(self, store: FirestoreService, ai: GeminiService) -> None:
        self.store = store
        self.ai = ai

    async def generate_report(self, session: Session) -> Report:
        existing = await self.store.get_report_by_session(session.id)
        if existing:
            return existing
        history = await self.store.get_messages(session.id)
        report = await self.ai.generate_feedback_report(str(uuid4()), session, history)
        dynamics = await self.store.list_conversation_dynamics(user_id=session.userId, session_id=session.id, limit_count=200)
        if dynamics:
            report.conversationDynamicsReport = self._build_dynamics_report(dynamics)
        if session.difficulty == "Nerve":
            report.nerveReport = CrossExaminationService(self.store).build_report_section(
                session,
                {
                    "confidenceScore": report.confidenceScore,
                    "clarityScore": report.clarityScore,
                    "persuasivenessScore": report.persuasivenessScore,
                    "calmnessScore": report.calmnessScore,
                    "structureScore": report.structureScore,
                },
                history,
            )
        return await self.store.save_report(report)

    def _build_dynamics_report(self, dynamics: list[dict]) -> dict:
        breakdowns = [item for item in dynamics if item.get("responseBreakdown") not in {None, "none"}]
        high_pressure = [item for item in dynamics if int(item.get("pressureLevel") or 0) >= 7]
        stance_changes = 0
        previous_stance = None
        for item in dynamics:
            stance = item.get("stance")
            if previous_stance and stance != previous_stance:
                stance_changes += 1
            previous_stance = stance
        actions = [item.get("aiAction") for item in dynamics if item.get("aiAction")]
        agreement_followups = [item for item in dynamics if item.get("stance") in {"supportive", "neutral"} and item.get("aiAction") in {"challenge", "escalate"}]
        recovery_moments = []
        for previous, current in zip(dynamics, dynamics[1:]):
            previous_level = previous.get("responseBreakdown") or "none"
            current_level = current.get("responseBreakdown") or "none"
            if previous_level in {"moderate", "severe"} and current_level in {"none", "mild"}:
                recovery_moments.append(current.get("turnId"))
        return {
            "summary": "Conversation pressure adapted across the session without using shame-based feedback.",
            "whereUserStruggled": [self._moment_label(item) for item in breakdowns[:5]],
            "pressureTriggers": [self._trigger_label(item) for item in high_pressure[:5]],
            "stanceChanges": stance_changes,
            "howUserHandledOpposition": self._handling_label(dynamics, {"skeptical", "opposing", "hostile"}),
            "howUserHandledAgreementFollowUp": self._handling_label(agreement_followups, {"supportive", "neutral"}),
            "responseBreakdownMoments": [item.get("turnId") for item in breakdowns[:8]],
            "recoveryMoments": recovery_moments[:8],
            "aiActionsUsed": sorted(set(actions)),
        }

    def _moment_label(self, item: dict) -> str:
        return f"Turn {item.get('turnId')}: {item.get('responseBreakdown')} breakdown, likely caused by {item.get('likelyCause')}."

    def _trigger_label(self, item: dict) -> str:
        return f"Pressure reached {item.get('pressureLevel')}/10 when the stance was {item.get('stance')} and the action was {item.get('aiAction')}."

    def _handling_label(self, dynamics: list[dict], stances: set[str]) -> str:
        relevant = [item for item in dynamics if item.get("stance") in stances]
        if not relevant:
            return "No major moments in this category were detected."
        severe = len([item for item in relevant if item.get("responseBreakdown") in {"moderate", "severe"}])
        if severe == 0:
            return "You generally stayed clear when this dynamic appeared."
        return "This dynamic sometimes made answers less direct; practice naming the claim first, then the evidence."
