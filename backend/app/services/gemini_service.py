import json
import re
import google.generativeai as genai
from app.config import get_settings
from app.models.message import Message
from app.models.report import Report
from app.models.session import Session
from app.services.prompt_service import build_report_prompt, build_roleplay_prompt
from app.utils.timestamps import utc_now_iso


class GeminiService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.enabled = bool(self.settings.gemini_api_key)
        if self.enabled:
            genai.configure(api_key=self.settings.gemini_api_key)
            self.model = genai.GenerativeModel(self.settings.gemini_model)
        else:
            self.model = None

    async def generate_roleplay_response(self, session: Session, history: list[Message]) -> str:
        if not self.enabled or self.model is None:
            return self._mock_roleplay(session, history)
        try:
            response = await self.model.generate_content_async(build_roleplay_prompt(session, history))
            return (response.text or self._mock_roleplay(session, history)).strip()
        except Exception:
            return self._mock_roleplay(session, history)

    async def generate_feedback_report(self, report_id: str, session: Session, history: list[Message]) -> Report:
        if not self.enabled or self.model is None:
            return self._mock_report(report_id, session)
        try:
            response = await self.model.generate_content_async(build_report_prompt(session, history))
            payload = self._parse_json(response.text or "")
            return Report(id=report_id, userId=session.userId, sessionId=session.id, createdAt=utc_now_iso(), **payload)
        except Exception:
            return self._mock_report(report_id, session)

    def _parse_json(self, text: str) -> dict:
        cleaned = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
        return json.loads(cleaned)

    def _mock_roleplay(self, session: Session, history: list[Message]) -> str:
        pressure = {
            "Friendly": "That is a solid start. Can you make it a little more specific?",
            "Realistic": "I understand the point, but I need clearer evidence. What example proves that?",
            "Brutal": "I am not convinced yet. Give me the strongest version without hedging.",
        }[session.difficulty]
        return f"{pressure} Stay focused on your goal: {session.goal}"

    def _mock_report(self, report_id: str, session: Session) -> Report:
        return Report(
            id=report_id,
            userId=session.userId,
            sessionId=session.id,
            confidenceScore=74,
            clarityScore=78,
            persuasivenessScore=70,
            calmnessScore=82,
            structureScore=76,
            summary=f"You handled the {session.practiceType.lower()} with steady intent and a clear goal. The next improvement is adding sharper examples under pressure.",
            strengths=["Stayed composed when challenged", "Kept answers relevant to the scenario", "Showed a clear preparation goal"],
            weakMoments=["Some answers were broad", "Evidence could be more concrete", "Closing statements needed more confidence"],
            missedOpportunities=["Ask clarifying questions before answering", "Tie answers back to measurable outcomes", "Use a stronger final summary"],
            improvedResponses=["I would frame this in three parts: context, action, and result.", "The strongest evidence is a recent example where I delivered under similar pressure.", "Before I answer, I want to clarify the main concern you want me to address."],
            drills=["Practice 60-second structured answers", "Record three objection responses", "Run one brutal-mode follow-up session"],
            nextRecommendation="Repeat this scenario at Realistic or Brutal difficulty and focus on concise evidence.",
            createdAt=utc_now_iso(),
        )
