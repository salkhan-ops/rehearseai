import json
import re
from typing import Optional
import google.generativeai as genai
from app.config import get_settings
from app.models.analytics import PerformanceAnalytics
from app.models.message import Message
from app.models.report import Report
from app.models.session import Session
from app.services.analytics_service import AnalyticsService
from app.services.prompt_service import build_report_prompt, build_roleplay_prompt
from app.utils.timestamps import utc_now_iso


class GeminiService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.enabled = bool(self.settings.gemini_api_key)
        if self.enabled:
            genai.configure(api_key=self.settings.gemini_api_key)
            self.roleplay_model = genai.GenerativeModel(self.settings.gemini_roleplay_model)
            self.report_model = genai.GenerativeModel(self.settings.gemini_model)
        else:
            self.roleplay_model = None
            self.report_model = None

    async def generate_roleplay_response(self, session: Session, history: list[Message], coordination_context: Optional[dict] = None) -> str:
        if not self.enabled or self.roleplay_model is None:
            return self._mock_roleplay(session, history, coordination_context)
        try:
            response = await self.roleplay_model.generate_content_async(
                build_roleplay_prompt(session, history, self.settings.ai_history_messages, coordination_context),
                generation_config={
                    "max_output_tokens": self.settings.ai_roleplay_max_output_tokens,
                    "temperature": self.settings.ai_temperature,
                },
            )
            return (response.text or self._mock_roleplay(session, history, coordination_context)).strip()
        except Exception:
            return self._mock_roleplay(session, history, coordination_context)

    async def generate_feedback_report(self, report_id: str, session: Session, history: list[Message]) -> Report:
        if not self.enabled or self.report_model is None:
            return self._mock_report(report_id, session)
        try:
            response = await self.report_model.generate_content_async(
                build_report_prompt(session, history[-24:]),
                generation_config={
                    "max_output_tokens": self.settings.ai_report_max_output_tokens,
                    "temperature": 0.35,
                    "response_mime_type": "application/json",
                },
            )
            payload = self._parse_json(response.text or "")
            return Report(id=report_id, userId=session.userId, sessionId=session.id, practiceLanguage=session.practiceLanguage, feedbackLanguage=session.feedbackLanguage, createdAt=utc_now_iso(), **payload)
        except Exception:
            return self._mock_report(report_id, session)

    async def generate_performance_analytics(
        self,
        session: Session,
        report: Report,
        history: list[Message],
        previous_sessions_count: int = 0,
    ) -> PerformanceAnalytics:
        fallback = AnalyticsService().build(session, report, history, previous_sessions_count)
        if not self.enabled or self.report_model is None:
            return fallback
        try:
            prompt = (
                "You are RehearseAI's cognitive performance intelligence engine. "
                "Return valid JSON only. Keep the exact schema and keys from the baseline JSON. "
                "You may improve the reasoning analysis, coaching suggestions, replay alternatives, heatmap labels, "
                "historical insights, and decision-tree wording. Keep all numerical scores between 0 and 100. "
                "Do not claim guaranteed success, therapy, legal advice, medical advice, or financial advice.\n\n"
                f"Session type: {session.practiceType}\n"
                f"Difficulty: {session.difficulty}\n"
                f"Topic: {session.topic}\n"
                f"Goal: {session.goal}\n\n"
                "Conversation history:\n"
                + "\n".join([f"{message.role}: {message.content}" for message in history[-24:]])
                + "\n\nBaseline JSON schema and fallback values:\n"
                + fallback.model_dump_json()
            )
            response = await self.report_model.generate_content_async(
                prompt,
                generation_config={
                    "max_output_tokens": max(self.settings.ai_report_max_output_tokens, 2600),
                    "temperature": 0.25,
                    "response_mime_type": "application/json",
                },
            )
            return PerformanceAnalytics(**self._parse_json(response.text or ""))
        except Exception:
            return fallback

    async def generate_course_outline(self, baseline: dict, user_history: list[dict]) -> dict:
        if not self.enabled or self.report_model is None:
            return baseline
        try:
            prompt = (
                "You are RehearseAI's cognitive performance curriculum engine. "
                "Return valid JSON only. Improve the provided baseline course without changing the schema. "
                "Make the program feel like elite cognitive fitness, not school. "
                "Keep pressure challenging but never abusive. Do not make guaranteed outcome claims.\n\n"
                "Baseline JSON:\n"
                + json.dumps(baseline)
                + "\n\nUser history summary:\n"
                + json.dumps(user_history[-20:])
            )
            response = await self.report_model.generate_content_async(
                prompt,
                generation_config={
                    "max_output_tokens": 4200,
                    "temperature": 0.35,
                    "response_mime_type": "application/json",
                },
            )
            payload = self._parse_json(response.text or "")
            return payload if isinstance(payload, dict) else baseline
        except Exception:
            return baseline

    def _parse_json(self, text: str) -> dict:
        cleaned = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
        return json.loads(cleaned)

    def _mock_roleplay(self, session: Session, history: list[Message], coordination_context: Optional[dict] = None) -> str:
        if coordination_context:
            state = coordination_context.get("userState")
            if state == "confused":
                return "Let me narrow it down. What is the one part of the question you want me to clarify first?"
            if state == "overexplaining":
                return "I am going to pause you there. Give me the core answer in one concise sentence."
            if state == "rushing":
                return "Slow it down for a moment. What is your main claim, and what is the single strongest proof?"
            if coordination_context.get("pressureAdjustment") == "increase":
                return "Good. Now take it one level deeper: what assumption in your answer would a skeptical person challenge first?"
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
            practiceLanguage=session.practiceLanguage,
            feedbackLanguage=session.feedbackLanguage,
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
