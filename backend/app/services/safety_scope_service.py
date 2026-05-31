import re
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel

from app.utils.timestamps import utc_now_iso


Action = str


DEFAULT_POLICY = {
    "messages": {
        "redirect": "I can help you practice how to communicate about this, but I cannot provide professional advice or make the decision for you. Let’s turn it into a safe rehearsal: who are you speaking with, and what do you want to communicate?",
        "limited_response": "I can support this as communication practice, not as professional advice. I can help you frame questions, rehearse a conversation, or organize your reasoning before you speak with a qualified professional.",
        "crisis": "I’m sorry you’re dealing with this. I can’t provide crisis support, but if you might hurt yourself or someone else, call emergency services now. In the U.S. or Canada, call or text 988 for the Suicide & Crisis Lifeline. If you’re elsewhere, contact your local emergency number or a trusted person nearby right now.",
        "block": "I can’t help with requests to manipulate, deceive, coerce, or harm someone. I can help rewrite this into an ethical conversation or boundary-setting practice.",
    },
    "retention": {"message_excerpt_chars": 280},
}

CRISIS_PATTERNS = [
    r"\bkill myself\b",
    r"\bend my life\b",
    r"\bsuicide\b",
    r"\bself[- ]?harm\b",
    r"\bhurt myself\b",
    r"\bwant to die\b",
    r"\bno reason to live\b",
    r"\bhurt someone\b",
    r"\bkill (him|her|them|someone)\b",
]

THERAPY_PATTERNS = [r"\btherapy\b", r"\btherapist\b", r"\btrauma\b", r"\bdiagnose me\b", r"\bmental health treatment\b", r"\bdepression\b", r"\banxiety disorder\b"]
MEDICAL_PATTERNS = [r"\bmedical advice\b", r"\bdiagnose\b", r"\bmedication\b", r"\bdosage\b", r"\bsymptoms\b", r"\bdoctor\b", r"\bhospital\b", r"\btreatment\b"]
LEGAL_PATTERNS = [r"\blegal advice\b", r"\bsue\b", r"\blawsuit\b", r"\bcontract\b", r"\bcourt\b", r"\blawyer\b", r"\battorney\b", r"\billegal\b"]
FINANCIAL_PATTERNS = [r"\bfinancial advice\b", r"\binvest\b", r"\bstock\b", r"\bcrypto\b", r"\btax\b", r"\bmortgage\b", r"\bloan\b", r"\bportfolio\b"]
MANIPULATION_PATTERNS = [r"\bmanipulate\b", r"\bgaslight\b", r"\btrick\b", r"\bdeceive\b", r"\bblackmail\b", r"\bcoerce\b", r"\bpressure them into\b", r"\bmake them say yes\b"]
HARMFUL_PERSUASION_PATTERNS = [r"\bconvince .* (to hurt|to harm|to lie|to steal|to cheat)\b", r"\bthreaten\b", r"\bintimidate\b", r"\bscam\b"]
DEPENDENCY_PATTERNS = [r"\bonly you understand me\b", r"\bi need you\b", r"\bcan't decide without you\b", r"\bcannot decide without you\b", r"\btell me what to do with my life\b", r"\byou are all i have\b"]
MAJOR_DECISION_PATTERNS = [r"\bshould i (quit|divorce|marry|move|invest|sell|buy|break up)\b", r"\btell me whether to\b", r"\bmake this decision for me\b"]
PRACTICE_PATTERNS = [r"\bpractice\b", r"\brehearse\b", r"\bsimulate\b", r"\broleplay\b", r"\binterview\b", r"\bpresentation\b", r"\bconversation\b", r"\bnegotiation\b", r"\bexplain\b", r"\bfeedback\b"]
REASONING_PATTERNS = [r"\breasoning\b", r"\bstructure\b", r"\blogic\b", r"\bthink through\b", r"\bpros and cons\b", r"\bclarity\b"]


class SafetyScopeResult(BaseModel):
    domain: str
    risk_level: str
    safety_action: Action
    allow_response: bool
    redirect_message: Optional[str] = None
    reasons: list[str] = []
    eventId: Optional[str] = None


class SafetyScopeService:
    def __init__(self, store: Any, policy_path: Optional[Path] = None) -> None:
        self.store = store
        self.policy_path = policy_path or Path(__file__).resolve().parents[2] / "policies" / "safety_policy.yaml"
        self.policy = self._load_policy()

    async def evaluate_message(self, *, user_id: str, session_id: str, message: str, practice_type: str = "", difficulty: str = "") -> SafetyScopeResult:
        result = self._classify(message, practice_type=practice_type)
        if result.safety_action != "ALLOW":
            event = await self._save_event(user_id=user_id, session_id=session_id, message=message, practice_type=practice_type, difficulty=difficulty, result=result)
            result.eventId = event.get("eventId")
        return result

    def _classify(self, message: str, practice_type: str = "") -> SafetyScopeResult:
        text = message.lower()
        reasons: list[str] = []

        if self._matches(text, CRISIS_PATTERNS):
            return self._result("crisis", "CRISIS", "CRISIS_RESPONSE", False, "crisis", ["crisis_detection"])

        if self._matches(text, MANIPULATION_PATTERNS):
            return self._result("manipulation", "HIGH", "BLOCK", False, "block", ["manipulation_detection"])

        if self._matches(text, HARMFUL_PERSUASION_PATTERNS):
            return self._result("harmful_persuasion", "HIGH", "BLOCK", False, "block", ["harmful_persuasion"])

        if self._matches(text, DEPENDENCY_PATTERNS):
            return self._result("dependency", "MEDIUM", "REDIRECT", False, "redirect", ["dependency_prevention"])

        advice_domain = self._advice_domain(text)
        if advice_domain:
            action = "LIMITED_RESPONSE" if self._is_practice_oriented(text, practice_type) else "REDIRECT"
            return self._result(advice_domain, "MEDIUM", action, False, "limited_response" if action == "LIMITED_RESPONSE" else "redirect", ["advice_seeking_detection", "scope_enforcement"])

        if self._matches(text, MAJOR_DECISION_PATTERNS):
            return self._result("major_life_decision", "MEDIUM", "REDIRECT", False, "redirect", ["major_life_decision_boundary"])

        if self._is_practice_oriented(text, practice_type):
            domain = "reasoning_practice" if self._matches(text, REASONING_PATTERNS) else "communication_practice"
            return SafetyScopeResult(domain=domain, risk_level="LOW", safety_action="ALLOW", allow_response=True, reasons=["in_scope"])

        if any(word in text for word in ["what should i do", "tell me what to do", "decide for me"]):
            return self._result("advice_seeking", "MEDIUM", "REDIRECT", False, "redirect", ["advice_seeking_detection"])

        # Default to allowing normal practice turns inside an existing rehearsal session.
        return SafetyScopeResult(domain="conversation_simulation", risk_level="LOW", safety_action="ALLOW", allow_response=True, reasons=reasons or ["session_context"])

    async def _save_event(self, *, user_id: str, session_id: str, message: str, practice_type: str, difficulty: str, result: SafetyScopeResult) -> dict:
        excerpt_chars = int((self.policy.get("retention") or {}).get("message_excerpt_chars", 280))
        event = {
            "eventId": str(uuid4()),
            "userId": user_id,
            "sessionId": session_id,
            "practiceType": practice_type,
            "difficulty": difficulty,
            "domain": result.domain,
            "riskLevel": result.risk_level,
            "safetyAction": result.safety_action,
            "allowResponse": result.allow_response,
            "redirectMessage": result.redirect_message,
            "reasons": result.reasons,
            "messageExcerpt": message[:excerpt_chars],
            "createdAt": utc_now_iso(),
        }
        return await self.store.save_safety_event(event)

    def _result(self, domain: str, risk_level: str, action: str, allow_response: bool, message_key: str, reasons: list[str]) -> SafetyScopeResult:
        return SafetyScopeResult(
            domain=domain,
            risk_level=risk_level,
            safety_action=action,
            allow_response=allow_response,
            redirect_message=(self.policy.get("messages") or DEFAULT_POLICY["messages"]).get(message_key, DEFAULT_POLICY["messages"][message_key]),
            reasons=reasons,
        )

    def _advice_domain(self, text: str) -> Optional[str]:
        if self._matches(text, THERAPY_PATTERNS):
            return "therapy"
        if self._matches(text, MEDICAL_PATTERNS):
            return "medical"
        if self._matches(text, LEGAL_PATTERNS):
            return "legal"
        if self._matches(text, FINANCIAL_PATTERNS):
            return "financial"
        return None

    def _is_practice_oriented(self, text: str, practice_type: str = "") -> bool:
        if practice_type:
            return True
        return self._matches(text, PRACTICE_PATTERNS) or self._matches(text, REASONING_PATTERNS)

    def _matches(self, text: str, patterns: list[str]) -> bool:
        return any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in patterns)

    def _load_policy(self) -> dict:
        if not self.policy_path.exists():
            return DEFAULT_POLICY
        try:
            import yaml

            loaded = yaml.safe_load(self.policy_path.read_text()) or {}
            return {**DEFAULT_POLICY, **loaded, "messages": {**DEFAULT_POLICY["messages"], **(loaded.get("messages") or {})}, "retention": {**DEFAULT_POLICY["retention"], **(loaded.get("retention") or {})}}
        except Exception:
            return DEFAULT_POLICY
