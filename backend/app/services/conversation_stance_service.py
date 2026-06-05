from typing import Literal, Optional

ConversationStance = Literal["supportive", "curious", "neutral", "skeptical", "opposing", "hostile"]


class ConversationStanceService:
    def choose_stance(
        self,
        *,
        mode: str,
        response_breakdown: str,
        likely_cause: str,
        pressure_level: int,
        user_state: str = "calm",
        turn_count: int = 0,
        panel_persona: Optional[str] = None,
    ) -> ConversationStance:
        mode = mode or "Intermediate"
        severe = response_breakdown in {"moderate", "severe"}
        strong = user_state == "improving" and response_breakdown == "none"
        seed = (turn_count + pressure_level + len(panel_persona or "")) % 10

        if mode in {"Beginner", "Friendly"}:
            if severe:
                return "supportive"
            return "curious" if seed in {1, 4, 7} else "supportive"

        if mode in {"Intermediate", "Realistic"}:
            if severe and likely_cause in {"confused", "emotionally pressured"}:
                return "curious"
            if strong or seed in {2, 5, 8}:
                return "skeptical"
            return "supportive" if seed == 0 else "neutral"

        if mode == "Advanced":
            if severe and likely_cause == "confused":
                return "curious"
            if strong or pressure_level >= 6 or seed in {1, 3, 6}:
                return "skeptical"
            return "opposing" if seed == 8 else "neutral"

        if mode == "Brutal":
            if pressure_level >= 8 or likely_cause in {"avoiding", "lacks evidence"}:
                return "opposing"
            if seed == 0 and response_breakdown == "none":
                return "neutral"
            return "skeptical"

        if mode == "Nerve":
            sequence: list[ConversationStance] = ["skeptical", "opposing", "curious", "neutral", "opposing", "skeptical"]
            stance = sequence[turn_count % len(sequence)]
            if pressure_level >= 8 and likely_cause in {"avoiding", "lacks evidence"}:
                return "hostile"
            return stance

        return "neutral"
