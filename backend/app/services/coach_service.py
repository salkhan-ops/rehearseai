from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel

from app.models.message import Message
from app.models.session import Session
from app.utils.timestamps import utc_now_iso


class CoachHint(BaseModel):
    hint: str
    hintType: str
    urgency: str
    confidence: float
    triggerReason: str


class CoachService:
    def __init__(self, store: Any) -> None:
        self.store = store

    def support_level(self, difficulty: str) -> float:
        return {
            "Beginner": 1.0,
            "Friendly": 1.0,
            "Intermediate": 0.5,
            "Realistic": 0.5,
            "Advanced": 0.0,
            "Brutal": 0.0,
        }.get(difficulty, 0.0)

    async def maybe_generate_hint(self, session: Session, history: list[Message], user_text: str, coordination_state: Optional[Any] = None) -> Optional[dict]:
        support = self.support_level(session.difficulty)
        if support <= 0:
            return None
        user_turn_index = len([message for message in history if message.role == "user"])
        if support < 1 and user_turn_index % 2 == 0:
            return None
        hint = self._rule_hint(user_text, coordination_state)
        if not hint:
            return None
        record = {
            "hintId": str(uuid4()),
            "userId": session.userId,
            "sessionId": session.id,
            "timestamp": utc_now_iso(),
            "hintText": hint.hint,
            "hintType": hint.hintType,
            "triggerReason": hint.triggerReason,
            "urgency": hint.urgency,
            "confidence": hint.confidence,
            "wasViewed": False,
            "wasExpanded": False,
            "createdAt": utc_now_iso(),
        }
        return await self.store.save_session_hint(record)

    def _rule_hint(self, text: str, coordination_state: Optional[Any] = None) -> Optional[CoachHint]:
        lower = text.lower()
        words = lower.split()
        word_count = len(words)
        evidence_markers = ["because", "example", "result", "data", "measured", "proved", "evidence"]
        stakeholder_markers = ["they", "their", "customer", "manager", "team", "audience", "buyer", "committee"]
        if word_count > 95:
            return CoachHint(hint="Your answer may be too broad. Try making the core point first, then add one example.", hintType="conciseness", urgency="medium", confidence=0.82, triggerReason="long_answer")
        if not any(marker in lower for marker in evidence_markers) and word_count > 18:
            return CoachHint(hint="Support your answer with evidence. One concrete example is enough.", hintType="evidence", urgency="medium", confidence=0.78, triggerReason="weak_evidence")
        if any(marker in lower for marker in ["but", "actually", "that's not", "you are wrong", "i disagree"]):
            return CoachHint(hint="Address the concern directly before introducing a new argument.", hintType="reasoning", urgency="medium", confidence=0.74, triggerReason="possible_defensiveness")
        if not any(marker in lower for marker in stakeholder_markers) and word_count > 25:
            return CoachHint(hint="Consider the other stakeholder's perspective before you defend your conclusion.", hintType="stakeholder", urgency="low", confidence=0.68, triggerReason="missing_stakeholder_perspective")
        state = getattr(coordination_state, "userState", "")
        if state == "rushing":
            return CoachHint(hint="Slow the structure down. Explain why before explaining what.", hintType="structure", urgency="medium", confidence=0.76, triggerReason="rushing")
        if state == "confused":
            return CoachHint(hint="Ask a clarifying question before answering. That is a reasoning move, not a weakness.", hintType="confidence", urgency="high", confidence=0.84, triggerReason="confusion")
        return CoachHint(hint="The other side is testing your reasoning, not only your conclusion.", hintType="reasoning", urgency="low", confidence=0.62, triggerReason="general_reasoning_support")
