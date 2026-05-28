from typing import Optional
from uuid import uuid4
from google.cloud import firestore
from app.config import get_settings
from app.models.message import Message
from app.models.report import Report
from app.models.session import Session, SessionCreate
from app.utils.timestamps import utc_now_iso


class FirestoreService:
    def __init__(self) -> None:
        settings = get_settings()
        self.enabled = bool(settings.firestore_project_id)
        self.client = firestore.Client(project=settings.firestore_project_id) if self.enabled else None
        self.sessions: dict[str, Session] = {}
        self.messages: dict[str, list[Message]] = {}
        self.reports: dict[str, Report] = {}

    async def create_session(self, payload: SessionCreate) -> Session:
        session = Session(id=str(uuid4()), createdAt=utc_now_iso(), **payload.model_dump())
        if self.client:
            self.client.collection("sessions").document(session.id).set(session.model_dump())
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
            docs = self.client.collection("sessions").where("userId", "==", user_id).stream()
            return [Session(**doc.to_dict()) for doc in docs]
        return [session for session in self.sessions.values() if session.userId == user_id]

    async def add_message(self, session_id: str, role: str, content: str) -> Message:
        message = Message(id=str(uuid4()), role=role, content=content, createdAt=utc_now_iso())
        if self.client:
            self.client.collection("sessions").document(session_id).collection("messages").document(message.id).set(message.model_dump())
        self.messages.setdefault(session_id, []).append(message)
        return message

    async def get_messages(self, session_id: str) -> list[Message]:
        if self.client:
            docs = self.client.collection("sessions").document(session_id).collection("messages").order_by("createdAt").stream()
            return [Message(**doc.to_dict()) for doc in docs]
        return self.messages.get(session_id, [])

    async def update_session(self, session: Session) -> Session:
        if self.client:
            self.client.collection("sessions").document(session.id).set(session.model_dump(), merge=True)
        self.sessions[session.id] = session
        return session

    async def save_report(self, report: Report) -> Report:
        if self.client:
            self.client.collection("reports").document(report.id).set(report.model_dump())
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
