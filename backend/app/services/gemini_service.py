import asyncio
import json
import logging
import re
from typing import Optional
import google.generativeai as genai
from app.config import get_settings
from app.models.analytics import PerformanceAnalytics
from app.models.message import Message
from app.models.report import Report
from app.models.session import Session
from app.services.analytics_service import AnalyticsService
from app.services.prompt_service import build_opening_prompt, build_report_prompt, build_roleplay_prompt
from app.utils.timestamps import utc_now_iso

logger = logging.getLogger(__name__)


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
            response = await asyncio.wait_for(
                self.roleplay_model.generate_content_async(
                    build_roleplay_prompt(session, history, self.settings.ai_history_messages, coordination_context),
                    generation_config={
                        "max_output_tokens": self.settings.ai_roleplay_max_output_tokens,
                        "temperature": self.settings.ai_temperature,
                    },
                ),
                timeout=self.settings.ai_roleplay_timeout_seconds,
            )
            return (response.text or self._mock_roleplay(session, history, coordination_context)).strip()
        except Exception as exc:
            logger.warning("Gemini roleplay response failed; using fallback: %s", exc)
            return self._mock_roleplay(session, history, coordination_context)

    async def generate_opening_response(self, session: Session) -> str:
        if not self.enabled or self.roleplay_model is None:
            return self._mock_opening(session)
        try:
            response = await asyncio.wait_for(
                self.roleplay_model.generate_content_async(
                    build_opening_prompt(session),
                    generation_config={
                        "max_output_tokens": 120,
                        "temperature": min(0.9, max(0.55, self.settings.ai_temperature)),
                    },
                ),
                timeout=min(8.0, self.settings.ai_roleplay_timeout_seconds),
            )
            return (response.text or self._mock_opening(session)).strip()
        except Exception as exc:
            logger.warning("Gemini opening response failed; using fallback: %s", exc)
            return self._mock_opening(session)

    async def check_access(self) -> dict:
        if not self.enabled or self.roleplay_model is None:
            return {"configured": False, "ok": False, "reason": "GEMINI_API_KEY is not configured"}
        try:
            response = await asyncio.wait_for(
                self.roleplay_model.generate_content_async(
                    "Reply with exactly: OK",
                    generation_config={"max_output_tokens": 8, "temperature": 0},
                ),
                timeout=min(8.0, self.settings.ai_roleplay_timeout_seconds),
            )
            text = (response.text or "").strip()
            return {"configured": True, "ok": bool(text), "model": self.settings.gemini_roleplay_model, "sample": text[:20]}
        except Exception as exc:
            logger.warning("Gemini access check failed: %s", exc)
            return {"configured": True, "ok": False, "model": self.settings.gemini_roleplay_model, "reason": exc.__class__.__name__}

    async def generate_feedback_report(self, report_id: str, session: Session, history: list[Message]) -> Report:
        if not self.enabled or self.report_model is None:
            return self._mock_report(report_id, session)
        try:
            response = await asyncio.wait_for(
                self.report_model.generate_content_async(
                    build_report_prompt(session, history[-24:]),
                    generation_config={
                        "max_output_tokens": self.settings.ai_report_max_output_tokens,
                        "temperature": 0.35,
                        "response_mime_type": "application/json",
                    },
                ),
                timeout=self.settings.ai_report_timeout_seconds,
            )
            payload = self._parse_json(response.text or "")
            return Report(id=report_id, userId=session.userId, sessionId=session.id, practiceLanguage=session.practiceLanguage, feedbackLanguage=session.feedbackLanguage, createdAt=utc_now_iso(), **payload)
        except Exception as exc:
            logger.warning("Gemini report response failed; using fallback: %s", exc)
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
            response = await asyncio.wait_for(
                self.report_model.generate_content_async(
                    prompt,
                    generation_config={
                        "max_output_tokens": max(self.settings.ai_report_max_output_tokens, 2600),
                        "temperature": 0.25,
                        "response_mime_type": "application/json",
                    },
                ),
                timeout=self.settings.ai_report_timeout_seconds,
            )
            return PerformanceAnalytics(**self._parse_json(response.text or ""))
        except Exception as exc:
            logger.warning("Gemini analytics response failed; using fallback: %s", exc)
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
            response = await asyncio.wait_for(
                self.report_model.generate_content_async(
                    prompt,
                    generation_config={
                        "max_output_tokens": 4200,
                        "temperature": 0.35,
                        "response_mime_type": "application/json",
                    },
                ),
                timeout=self.settings.ai_report_timeout_seconds,
            )
            payload = self._parse_json(response.text or "")
            return payload if isinstance(payload, dict) else baseline
        except Exception as exc:
            logger.warning("Gemini course outline response failed; using fallback: %s", exc)
            return baseline

    def _parse_json(self, text: str) -> dict:
        cleaned = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
        return json.loads(cleaned)

    def _mock_roleplay(self, session: Session, history: list[Message], coordination_context: Optional[dict] = None) -> str:
        latest_user = next((message.content for message in reversed(history) if message.role == "user"), "")
        previous_ai = [message.content for message in history if message.role == "ai"]
        lower_latest = latest_user.lower()

        def first_fresh(options: list[str]) -> str:
            for option in options:
                if option not in previous_ai[-4:]:
                    return option
            return options[len(previous_ai) % len(options)]

        if "stop repeating" in lower_latest or "repeat" in lower_latest:
            return "Fair. I hear you. Let us drop the canned line and work with your actual point: what claim do you want to make about the Tesla price, and what evidence would make that price feel justified?"
        if any(term in lower_latest for term in ["tesla", "rocket", "mars", "price", "ips"]):
            return first_fresh([
                "Okay, now we have a real argument. Are you saying the high price is justified by extreme technical risk, launch constraints, and the cost of reaching Mars? Put that into one clean claim.",
                "That sounds like a pricing-defense question. I would challenge the leap from difficulty to price: what evidence shows buyers should pay that much, not just admire the engineering?",
                "I can feel the point you are reaching for. Separate it into three parts: why the mission is hard, why that raises cost, and why the final price is still rational.",
            ])

        if coordination_context:
            nerve = coordination_context.get("nerve") or {}
            if nerve:
                if nerve.get("shouldInterrupt"):
                    return f"That does not answer the question. {nerve.get('instruction', 'Where is your evidence?')}"
                objections = (nerve.get("analysis") or {}).get("possibleObjections") or ["What evidence supports that claim?"]
                return str(objections[0])
            state = coordination_context.get("userState")
            if state == "confused":
                return first_fresh([
                    "Let me narrow it down. What is the one part of the question you want me to clarify first?",
                    "No problem. Let us make the target smaller: are you defending the idea, the evidence, or the price?",
                ])
            if state == "overexplaining":
                return first_fresh([
                    "I am going to pause you there. Give me the core answer in one concise sentence.",
                    "Too many threads at once. Pick the strongest one and say it cleanly.",
                ])
            if state == "rushing":
                return first_fresh([
                    "Slow it down for a moment. What is your main claim, and what is the single strongest proof?",
                    "Take one breath. Lead with the claim, then give me only the proof that matters most.",
                ])
            if coordination_context.get("pressureAdjustment") == "increase":
                return first_fresh([
                    "Good. Now take it one level deeper: what assumption in your answer would a skeptical person challenge first?",
                    "Sharper now. Let me press the next layer: what would make your argument fail?",
                    "That has a spine. Now defend the riskiest assumption in it.",
                ])

        difficulty_responses = {
            "Beginner": [
                "That is a useful start. Say the main point first, then give me one concrete example.",
                "I am with you. What is the simplest version of your answer in one sentence?",
            ],
            "Intermediate": [
                "I understand the point, but I need clearer evidence. What example proves that?",
                "That answer has direction. Now make it less general: what happened, what changed, and what result followed?",
            ],
            "Advanced": [
                "That needs tighter reasoning. What assumption would I challenge first?",
                "Good pressure test: if I disagreed, which part of your logic would be easiest for me to attack?",
            ],
            "Friendly": [
                "That is a solid start. Can you make it a little more specific?",
                "Nice. Give me one human detail so it sounds lived, not rehearsed.",
            ],
            "Realistic": [
                "I understand the point, but I need clearer evidence. What example proves that?",
                "You are close, but it still sounds broad. Give me the strongest proof point and skip the setup.",
            ],
            "Brutal": [
                "I am not convinced yet. Give me the strongest version without hedging.",
                "That is too soft for this room. Make the claim directly, then defend it with one hard fact.",
            ],
            "Nerve": [
                "Where is your evidence? Defend the assumption behind your claim without giving me a generic answer.",
                "I am going to challenge the weakest link: what proof do you have that this is feasible, not just ambitious?",
            ],
        }
        return first_fresh(difficulty_responses[session.difficulty])

    def _mock_opening(self, session: Session) -> str:
        openings = {
            "Job Interview": f"Let us begin with the real question. For {session.topic}, what is the strongest evidence that you are ready for this role?",
            "Presentation / Public Speaking": f"I am in the audience and I need a reason to care. Open your {session.topic} in one clear sentence.",
            "Panel Discussion": f"I will start the panel. On {session.topic}, what is your position, and what would you say to someone who disagrees?",
            "Thesis Defense": f"Let us begin with your central claim. What is the most defensible argument in your {session.topic}, and where is it vulnerable?",
            "Salary Negotiation": f"I am going to be direct: why should this compensation change? Give me the evidence, not the desire.",
            "Difficult Conversation": f"I am here and I am listening. What is the issue you need to raise, and what outcome are you trying to protect?",
            "Teaching Session": f"I am your learner, and I am not fully following yet. Explain {session.topic} from the first principle.",
            "Sales Pitch": f"I am skeptical about cost and urgency. Why should I care about {session.topic} now?",
        }
        return openings[session.practiceType]

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
