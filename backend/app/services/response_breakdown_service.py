import re
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


ResponseBreakdown = Literal["none", "mild", "moderate", "severe"]
LikelyCause = Literal["thinking", "confused", "avoiding", "overexplaining", "emotionally pressured", "lacks evidence"]

FILLER_WORDS = {"um", "uh", "erm", "ah", "like", "basically", "actually", "just", "so", "well"}
HESITATION_MARKERS = {"i guess", "maybe", "sort of", "kind of", "you know", "not sure", "let me think"}
CONFUSION_MARKERS = {"i don't know", "i dont know", "i don't understand", "i am confused", "what do you mean", "can you clarify"}
VAGUE_MARKERS = {"stuff", "things", "somehow", "probably", "whatever", "etc", "and so on", "it depends"}
AVOIDANCE_MARKERS = {"anyway", "as i said", "to be honest", "the point is", "moving on", "that's not the issue"}
EVIDENCE_MARKERS = {"because", "example", "data", "result", "measured", "evidence", "proof", "for instance"}
CONTRADICTION_MARKERS = {"but actually", "on the other hand", "that said", "although", "however", "except"}


class ResponseBreakdownResult(BaseModel):
    responseBreakdown: ResponseBreakdown = "none"
    likelyCause: LikelyCause = "thinking"
    signals: list[str] = Field(default_factory=list)
    score: int = 0


class ResponseBreakdownDetector:
    def detect(
        self,
        *,
        transcript: str,
        interim_transcript: str = "",
        silence_ms: int = 0,
        speech_duration_ms: int = 0,
        profile: Optional[Any] = None,
        user_state: str = "calm",
        camera_assisted: bool = False,
        camera_hesitation: bool = False,
    ) -> ResponseBreakdownResult:
        text = f"{transcript} {interim_transcript}".strip()
        lower = text.lower()
        words = re.findall(r"[A-Za-z']+", lower)
        word_count = len(words)
        profile_pause = int(getattr(profile, "longPauseThresholdMs", 3200) or 3200)
        overexplain_words = int(getattr(profile, "overExplainWordThreshold", 140) or 140)
        signals: list[str] = []
        score = 0

        if silence_ms >= profile_pause and word_count < 12:
            signals.append("long_pause")
            score += 2
        if silence_ms >= profile_pause * 1.7 and word_count < 8:
            signals.append("long_silence_after_challenge")
            score += 2
        filler_count = sum(1 for word in words if word in FILLER_WORDS)
        if filler_count >= max(3, round(word_count * 0.08)):
            signals.append("filler_words")
            score += 1
        if any(marker in lower for marker in HESITATION_MARKERS):
            signals.append("repeated_hesitation")
            score += 1
        if any(marker in lower for marker in CONFUSION_MARKERS):
            signals.append("explicit_uncertainty")
            score += 2
        if any(marker in lower for marker in VAGUE_MARKERS):
            signals.append("vague_language")
            score += 1
        if any(marker in lower for marker in AVOIDANCE_MARKERS):
            signals.append("possible_avoidance")
            score += 1
        if word_count <= 4 and text:
            signals.append("incomplete_answer")
            score += 1
        if text.endswith((",", "and", "but", "because", "so")):
            signals.append("incomplete_answer")
            score += 1
        if any(marker in lower for marker in CONTRADICTION_MARKERS):
            signals.append("possible_contradiction")
            score += 1
        if word_count >= overexplain_words and not any(marker in lower for marker in EVIDENCE_MARKERS):
            signals.append("overexplaining_without_evidence")
            score += 2
        if user_state in {"confused", "collapsing"}:
            score += 2
            signals.append(f"user_state_{user_state}")
        elif user_state in {"hesitating", "overexplaining", "defensive", "rushing"}:
            score += 1
            signals.append(f"user_state_{user_state}")
        if camera_assisted and camera_hesitation:
            signals.append("camera_hesitation_signal")
            score += 1
        if speech_duration_ms >= 65000 and word_count < 24:
            signals.append("low_output_long_duration")
            score += 1

        breakdown: ResponseBreakdown = "none"
        if score >= 6:
            breakdown = "severe"
        elif score >= 4:
            breakdown = "moderate"
        elif score >= 2:
            breakdown = "mild"

        likely_cause = self._likely_cause(lower, signals, user_state)
        return ResponseBreakdownResult(responseBreakdown=breakdown, likelyCause=likely_cause, signals=sorted(set(signals)), score=score)

    def _likely_cause(self, lower: str, signals: list[str], user_state: str) -> LikelyCause:
        if "overexplaining_without_evidence" in signals or user_state == "overexplaining":
            return "overexplaining"
        if "possible_avoidance" in signals or user_state == "defensive":
            return "avoiding"
        if "explicit_uncertainty" in signals or user_state in {"confused", "collapsing"}:
            return "confused"
        if "vague_language" in signals and not any(marker in lower for marker in EVIDENCE_MARKERS):
            return "lacks evidence"
        if user_state in {"rushing", "hesitating"}:
            return "emotionally pressured"
        return "thinking"


responseBreakdownDetector = ResponseBreakdownDetector()
