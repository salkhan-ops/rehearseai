from uuid import uuid4
from app.models.report import Report
from app.models.session import Session
from app.services.gemini_service import GeminiService
from app.services.firestore_service import FirestoreService


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
        return await self.store.save_report(report)
