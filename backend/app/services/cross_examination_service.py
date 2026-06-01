import re
from statistics import mean
from typing import Optional
from uuid import uuid4

from app.models.message import Message
from app.models.session import Session
from app.services.conversation_coordination_service import CoordinationState
from app.services.firestore_service import FirestoreService
from app.utils.timestamps import utc_now_iso


PERSONA_ATTACKS = {
    "Investor": ["market size", "defensibility", "revenue assumptions", "competition", "execution risk"],
    "Professor": ["methodology", "causality", "robustness", "contribution", "literature gap"],
    "Executive": ["business impact", "tradeoffs", "feasibility", "risk ownership", "operating detail"],
    "Board Member": ["governance", "strategic risk", "accountability", "capital allocation", "long-term exposure"],
    "Regulator": ["compliance", "public risk", "evidence standard", "edge cases", "unintended consequences"],
    "Consultant": ["assumptions", "alternatives", "implementation path", "measurement", "stakeholders"],
    "Client": ["value", "trust", "cost", "delivery risk", "proof"],
    "Mixed Panel": ["logic", "evidence", "assumptions", "risk", "consistency"],
}

WEAK_MARKERS = ["maybe", "probably", "i think", "sort of", "kind of", "stuff", "things", "generally"]
EVIDENCE_MARKERS = ["because", "data", "evidence", "measured", "example", "result", "study", "customer", "metric"]
EVASION_MARKERS = ["it depends", "that's complicated", "hard to say", "not sure", "i guess"]


class CrossExaminationService:
    def __init__(self, store: FirestoreService) -> None:
        self.store = store

    async def prepare_session(self, session: Session) -> Session:
        if session.difficulty != "Nerve":
            return session
        analysis = self._analyze_material(session)
        saved = await self.store.save_session_analysis(analysis)
        session.nerveAnalysisId = saved["analysisId"]
        session.pressureLevel = max(1, session.pressureLevel or 1)
        return await self.store.update_session(session)

    async def build_turn_context(
        self,
        session: Session,
        history: list[Message],
        user_message: str,
        coordination_state: Optional[CoordinationState],
    ) -> dict:
        weakness = self._turn_weakness(user_message, coordination_state)
        pressure_level = self._next_pressure(session.pressureLevel or 1, weakness, coordination_state)
        session.pressureLevel = pressure_level
        await self.store.update_session(session)
        analysis = await self.store.get_session_analysis(session.nerveAnalysisId) if session.nerveAnalysisId else self._analyze_material(session)
        persona = session.nervePersona or "Mixed Panel"
        attack_surface = PERSONA_ATTACKS.get(persona, PERSONA_ATTACKS["Mixed Panel"])
        return {
            "mode": "Nerve",
            "entryType": session.nerveEntryType or "Topic",
            "persona": persona,
            "pressureLevel": pressure_level,
            "questionStyle": self._question_style(persona, pressure_level),
            "shouldInterrupt": weakness["shouldInterrupt"],
            "weaknessExposed": weakness["label"],
            "attackSurface": attack_surface,
            "analysis": analysis,
            "instruction": self._instruction(persona, pressure_level, weakness, attack_surface),
            "recentFailures": self._recent_failures(history),
        }

    def build_report_section(self, session: Session, report_scores: dict, history: list[Message]) -> dict:
        user_messages = [message.content for message in history if message.role == "user"] or [session.goal]
        joined = " ".join(user_messages).lower()
        avg_words = mean([len(message.split()) for message in user_messages])
        evidence = sum(joined.count(marker) for marker in EVIDENCE_MARKERS)
        weak = sum(joined.count(marker) for marker in WEAK_MARKERS)
        evasive = sum(joined.count(marker) for marker in EVASION_MARKERS)
        contradiction = self._contradiction_count(joined)
        evidence_quality = self._clamp(62 + evidence * 7 - weak * 4)
        logical_consistency = self._clamp(report_scores.get("structureScore", 70) - contradiction * 8 - evasive * 4)
        directness = self._clamp(88 - max(0, avg_words - 38) * 1.4 - evasive * 5)
        resilience = self._clamp((report_scores.get("calmnessScore", 70) + report_scores.get("confidenceScore", 70)) / 2)
        defendability = self._clamp(mean([evidence_quality, logical_consistency, directness, resilience]))
        return {
            "defendabilityScore": defendability,
            "metrics": {
                "Argument Stability": logical_consistency,
                "Pressure Recovery": resilience,
                "Evidence Quality": evidence_quality,
                "Logical Consistency": logical_consistency,
                "Directness": directness,
                "Composure": report_scores.get("calmnessScore", resilience),
                "Response Precision": self._clamp((directness + evidence_quality) / 2),
                "Objection Handling": self._clamp((resilience + logical_consistency) / 2),
            },
            "strongestDefense": max(user_messages, key=lambda item: item.lower().count("because") + item.lower().count("example"))[:260],
            "weakestDefense": max(user_messages, key=lambda item: len(item.split()) - item.lower().count("because") * 8)[:260],
            "questionsThatBrokeYou": self._broken_questions(history),
            "assumptionsYouCouldNotDefend": self._assumptions(joined)[:4],
            "recommendedFollowUpPractice": "Run the same material with a Mixed Panel and answer each objection with claim, evidence, risk, and fallback.",
        }

    def _analyze_material(self, session: Session) -> dict:
        text = " ".join([session.topic, session.context, session.goal, session.optionalNotes or "", session.nerveMaterialText or ""]).strip()
        sentences = [item.strip() for item in re.split(r"[.!?\n]+", text) if item.strip()]
        claims = sentences[:8] or [session.topic]
        assumptions = [f"The claim depends on: {claim[:120]}" for claim in claims[:4]]
        weak_evidence = [claim[:160] for claim in claims if not any(marker in claim.lower() for marker in EVIDENCE_MARKERS)][:5]
        return {
            "analysisId": str(uuid4()),
            "sessionId": session.id,
            "userId": session.userId,
            "entryType": session.nerveEntryType or "Topic",
            "materialName": session.nerveMaterialName or "",
            "assumptions": assumptions,
            "weakEvidence": weak_evidence or ["Evidence standard is not explicit enough yet."],
            "unsupportedClaims": weak_evidence or claims[:3],
            "logicalGaps": ["Causality, feasibility, and alternative explanations need explicit defense."],
            "possibleObjections": self._possible_objections(session),
            "stakeholderConcerns": PERSONA_ATTACKS.get(session.nervePersona or "Mixed Panel", PERSONA_ATTACKS["Mixed Panel"]),
            "alternativeExplanations": ["The observed outcome may come from selection bias, timing, incentives, or hidden constraints."],
            "createdAt": utc_now_iso(),
        }

    def _possible_objections(self, session: Session) -> list[str]:
        topic = session.topic or "this claim"
        return [
            f"What evidence supports {topic}?",
            "Which assumptions are doing the most work here?",
            "What would change your conclusion?",
            "What is the strongest counterexample?",
        ]

    def _turn_weakness(self, text: str, coordination_state: Optional[CoordinationState]) -> dict:
        lower = text.lower()
        words = len(text.split())
        evidence = sum(lower.count(marker) for marker in EVIDENCE_MARKERS)
        weak = sum(lower.count(marker) for marker in WEAK_MARKERS)
        evasive = sum(lower.count(marker) for marker in EVASION_MARKERS)
        overlong = words > 90 or (coordination_state and coordination_state.userState == "overexplaining")
        if evasive:
            return {"label": "question avoidance", "shouldInterrupt": True, "severity": 3}
        if evidence == 0 and words > 18:
            return {"label": "unsupported claim", "shouldInterrupt": True, "severity": 3}
        if overlong:
            return {"label": "overexplaining", "shouldInterrupt": True, "severity": 2}
        if weak:
            return {"label": "soft language", "shouldInterrupt": False, "severity": 1}
        return {"label": "defense holding", "shouldInterrupt": False, "severity": -1}

    def _next_pressure(self, current: int, weakness: dict, coordination_state: Optional[CoordinationState]) -> int:
        if coordination_state and coordination_state.userState in {"collapsing", "confused"}:
            return max(1, current - 1)
        if weakness["severity"] < 0:
            return min(10, current + 1)
        return min(10, current + max(0, weakness["severity"] - 1))

    def _question_style(self, persona: str, pressure_level: int) -> str:
        if pressure_level >= 8:
            return "hostile panel"
        if persona in {"Investor", "Board Member", "Executive"}:
            return "executive"
        if persona in {"Professor", "Regulator"}:
            return "technical expert"
        return "skeptical"

    def _instruction(self, persona: str, pressure_level: int, weakness: dict, attack_surface: list[str]) -> str:
        interruption = "Interrupt immediately if the user evades, rambles, or fails to answer." if weakness["shouldInterrupt"] else "Do not interrupt unless the next answer becomes evasive or unsupported."
        return (
            f"Act as a {persona}. Pressure level {pressure_level}/10. Attack {', '.join(attack_surface[:4])}. "
            f"Current weakness exposed: {weakness['label']}. {interruption} Ask one hard cross-examination question."
        )

    def _recent_failures(self, history: list[Message]) -> list[str]:
        failures = []
        for message in history[-8:]:
            if message.role == "user":
                weakness = self._turn_weakness(message.content, None)
                if weakness["label"] != "defense holding":
                    failures.append(weakness["label"])
        return failures[-3:]

    def _broken_questions(self, history: list[Message]) -> list[str]:
        questions = [message.content for message in history if message.role == "ai" and "?" in message.content]
        return questions[-3:] or ["Where is the evidence?", "What assumption are you making?", "What happens if this fails?"]

    def _assumptions(self, joined: str) -> list[str]:
        defaults = ["The evidence is strong enough.", "The audience accepts the causal link.", "The plan is feasible under pressure.", "Alternatives are weaker."]
        if "productivity" in joined:
            return ["Productivity can be measured consistently.", "Remote work effects are not selection bias.", "Industry differences do not overturn the claim.", "Output quality is not being ignored."]
        return defaults

    def _contradiction_count(self, text: str) -> int:
        pairs = [("always", "never"), ("increase", "decrease"), ("mandatory", "optional"), ("low risk", "high risk")]
        return sum(1 for left, right in pairs if left in text and right in text)

    def _clamp(self, value: float) -> int:
        return max(0, min(100, round(value)))
