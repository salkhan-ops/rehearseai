from typing import Literal, Optional

from pydantic import BaseModel


AiAction = Literal["support", "clarify", "challenge", "interrupt", "escalate", "multi_panel_followup"]


class PressureDecision(BaseModel):
    pressureLevel: int
    aiAction: AiAction
    shouldClarify: bool = False
    shouldChallenge: bool = False
    shouldInterrupt: bool = False
    shouldSupport: bool = False
    shouldEscalate: bool = False


class PressureEscalationService:
    def next_pressure(
        self,
        *,
        mode: str,
        current_pressure: int = 1,
        response_breakdown: str = "none",
        likely_cause: str = "thinking",
        user_state: str = "calm",
        stance: str = "neutral",
        safety_risk_level: str = "LOW",
    ) -> PressureDecision:
        mode = mode or "Intermediate"
        pressure = max(1, min(10, int(current_pressure or 1)))

        if safety_risk_level.upper() in {"MEDIUM", "HIGH", "CRISIS"}:
            pressure = max(1, min(pressure, 3))
            return PressureDecision(pressureLevel=pressure, aiAction="support", shouldSupport=True, shouldClarify=True)

        if mode in {"Nerve", "Brutal"}:
            pressure += 1
        if response_breakdown in {"moderate", "severe"}:
            pressure += 1 if mode not in {"Beginner", "Friendly"} else -1
        if likely_cause in {"avoiding", "lacks evidence", "overexplaining"}:
            pressure += 1
        if user_state == "improving":
            pressure += 1
        if user_state in {"confused", "collapsing"}:
            pressure -= 1
        pressure = max(1, min(10, pressure))

        if mode in {"Beginner", "Friendly"} and response_breakdown != "none":
            return PressureDecision(pressureLevel=pressure, aiAction="clarify", shouldClarify=True, shouldSupport=True)
        if mode == "Nerve" and response_breakdown in {"moderate", "severe"}:
            return PressureDecision(pressureLevel=pressure, aiAction="multi_panel_followup", shouldChallenge=True, shouldInterrupt=pressure >= 5, shouldEscalate=True)
        if mode == "Brutal" and response_breakdown != "none":
            return PressureDecision(pressureLevel=pressure, aiAction="challenge", shouldChallenge=True, shouldInterrupt=likely_cause in {"avoiding", "overexplaining"}, shouldEscalate=True)
        if stance in {"opposing", "hostile"} or pressure >= 7:
            return PressureDecision(pressureLevel=pressure, aiAction="escalate", shouldChallenge=True, shouldEscalate=True, shouldInterrupt=mode == "Nerve" and pressure >= 8)
        if stance == "supportive":
            return PressureDecision(pressureLevel=pressure, aiAction="support", shouldSupport=True)
        if stance == "curious" or response_breakdown == "mild":
            return PressureDecision(pressureLevel=pressure, aiAction="clarify", shouldClarify=True)
        return PressureDecision(pressureLevel=pressure, aiAction="challenge", shouldChallenge=True)
