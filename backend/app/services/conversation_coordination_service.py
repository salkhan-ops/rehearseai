import re
from typing import Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field

from app.services.firestore_service import FirestoreService
from app.utils.timestamps import utc_now_iso


CALIBRATION_PARAGRAPH = (
    "Today I want to practice speaking clearly under pressure. I may pause while thinking, "
    "but I want the system to understand when I am finished and when I need a moment."
)

FILLER_WORDS = {"um", "uh", "erm", "ah", "like", "basically", "actually", "just", "so", "well"}
HESITATION_MARKERS = {"i guess", "maybe", "sort of", "kind of", "you know", "not sure", "let me think"}
WAIT_PHRASES = {"wait", "let me think", "one second", "hold on", "give me a moment", "just a second"}
CONFUSION_PHRASES = {"i don't understand", "i am confused", "what do you mean", "can you clarify", "not sure"}
DEFENSIVE_PHRASES = {"that's not true", "to be fair", "honestly", "i already said", "but i did", "you are wrong"}

UserState = Literal["calm", "thinking", "confused", "rushing", "hesitating", "defensive", "overexplaining", "collapsing", "improving"]
ResponseLength = Literal["micro", "short", "medium"]
PressureAdjustment = Literal["decrease", "maintain", "increase"]


class WordTiming(BaseModel):
    word: str
    startMs: Optional[int] = None
    endMs: Optional[int] = None


class VoiceProfile(BaseModel):
    userId: str
    averageWordsPerMinute: float = 125
    averagePauseMs: int = 900
    longPauseThresholdMs: int = 3200
    fillerWordRate: float = 0
    hesitationMarkers: list[str] = Field(default_factory=list)
    preferredAiWaitMs: int = 900
    confidenceBaseline: Optional[float] = None
    createdAt: str
    updatedAt: str


class CalibrationStartResponse(BaseModel):
    calibrationId: str
    userId: str
    paragraph: str
    startedAt: str


class CalibrationCompleteRequest(BaseModel):
    userId: str = "guest"
    transcript: str = ""
    speechDurationMs: int = 0
    pausesMs: list[int] = Field(default_factory=list)
    wordTimings: list[WordTiming] = Field(default_factory=list)


class CoordinationAnalyzeRequest(BaseModel):
    transcript: str = ""
    interimTranscript: str = ""
    speechDurationMs: int = 0
    silenceMs: int = 0
    wordTimings: list[WordTiming] = Field(default_factory=list)
    sessionId: Optional[str] = None
    userId: str = "guest"


class CartesiaCoordination(BaseModel):
    voiceEmotion: str
    speakingRate: float
    intensity: float
    pauseStyle: str


class CoordinationState(BaseModel):
    userState: UserState
    silenceMs: int
    speechDurationMs: int
    wordsPerMinute: float
    fillerCount: int
    shouldAiWait: bool
    shouldAiRespond: bool
    shouldAiInterrupt: bool
    recommendedAiTone: str
    recommendedResponseLength: ResponseLength
    pressureAdjustment: PressureAdjustment
    coachingSignal: str
    cartesia: CartesiaCoordination


class ConversationCoordinationService:
    def __init__(self, store: FirestoreService) -> None:
        self.store = store

    async def start_calibration(self, user_id: str) -> CalibrationStartResponse:
        return CalibrationStartResponse(
            calibrationId=str(uuid4()),
            userId=user_id,
            paragraph=CALIBRATION_PARAGRAPH,
            startedAt=utc_now_iso(),
        )

    async def complete_calibration(self, payload: CalibrationCompleteRequest) -> VoiceProfile:
        words = self._words(payload.transcript)
        speech_ms = max(payload.speechDurationMs, 1)
        wpm = self._words_per_minute(len(words), speech_ms)
        pauses = payload.pausesMs or self._pauses_from_word_timings(payload.wordTimings)
        avg_pause = round(sum(pauses) / max(1, len(pauses))) if pauses else 900
        filler_count = self._filler_count(payload.transcript)
        markers = self._markers(payload.transcript, HESITATION_MARKERS)
        now = utc_now_iso()
        existing = await self.store.get_voice_profile(payload.userId)
        created_at = (existing or {}).get("createdAt", now)
        profile = VoiceProfile(
            userId=payload.userId,
            averageWordsPerMinute=round(wpm or 125, 1),
            averagePauseMs=max(300, avg_pause),
            longPauseThresholdMs=max(1800, min(7000, round((avg_pause or 900) * 2.6))),
            fillerWordRate=round(filler_count / max(1, len(words)), 4),
            hesitationMarkers=markers,
            preferredAiWaitMs=max(500, min(2200, round((avg_pause or 900) * 0.9))),
            confidenceBaseline=None,
            createdAt=created_at,
            updatedAt=now,
        )
        return await self.store.save_voice_profile(profile.model_dump())

    async def analyze(self, payload: CoordinationAnalyzeRequest) -> CoordinationState:
        profile_data = await self.store.get_voice_profile(payload.userId)
        profile = VoiceProfile(**profile_data) if profile_data else self._default_profile(payload.userId)
        state = self._analyze(payload, profile)
        await self.store.save_conversation_state(
            payload.sessionId or f"coordination_{payload.userId}",
            payload.userId,
            state.model_dump(),
        )
        return state

    def _analyze(self, payload: CoordinationAnalyzeRequest, profile: VoiceProfile) -> CoordinationState:
        text = f"{payload.transcript} {payload.interimTranscript}".strip()
        words = self._words(text)
        wpm = self._words_per_minute(len(words), payload.speechDurationMs)
        filler_count = self._filler_count(text)
        lower = text.lower()
        markers = set(self._markers(lower, HESITATION_MARKERS))
        wait_requested = any(phrase in lower for phrase in WAIT_PHRASES)
        confused = any(phrase in lower for phrase in CONFUSION_PHRASES)
        defensive = any(phrase in lower for phrase in DEFENSIVE_PHRASES)
        silence_threshold = profile.longPauseThresholdMs + (1800 if wait_requested else 0)
        overlong_ms = max(70000, round((profile.averageWordsPerMinute / 125) * 80000))
        overexplaining = payload.speechDurationMs > overlong_ms or len(words) > 190
        rushing = wpm > max(165, profile.averageWordsPerMinute * 1.35)
        hesitating = bool(markers) or filler_count >= max(3, round(len(words) * 0.08))
        collapsing = payload.silenceMs > silence_threshold * 1.8 and len(words) < 8

        user_state: UserState = "calm"
        if collapsing:
            user_state = "collapsing"
        elif confused:
            user_state = "confused"
        elif defensive:
            user_state = "defensive"
        elif overexplaining:
            user_state = "overexplaining"
        elif rushing:
            user_state = "rushing"
        elif wait_requested or (payload.silenceMs > profile.averagePauseMs and payload.silenceMs < silence_threshold):
            user_state = "thinking"
        elif hesitating:
            user_state = "hesitating"
        elif wpm and wpm >= profile.averageWordsPerMinute * 0.95 and filler_count <= max(1, round(len(words) * 0.03)) and len(words) >= 18:
            user_state = "improving"

        should_interrupt = overexplaining and payload.speechDurationMs > 45000
        should_respond = bool(words) and payload.silenceMs >= silence_threshold and not wait_requested
        should_wait = not should_respond and not should_interrupt
        tone = self._tone(user_state)
        response_length: ResponseLength = "short"
        if user_state in {"confused", "collapsing", "rushing"}:
            response_length = "micro"
        elif user_state in {"calm", "improving"}:
            response_length = "medium"
        pressure: PressureAdjustment = "maintain"
        if user_state in {"confused", "collapsing", "hesitating", "rushing"}:
            pressure = "decrease"
        elif user_state == "improving":
            pressure = "increase"

        return CoordinationState(
            userState=user_state,
            silenceMs=payload.silenceMs,
            speechDurationMs=payload.speechDurationMs,
            wordsPerMinute=round(wpm, 1),
            fillerCount=filler_count,
            shouldAiWait=should_wait,
            shouldAiRespond=should_respond,
            shouldAiInterrupt=should_interrupt,
            recommendedAiTone=tone,
            recommendedResponseLength=response_length,
            pressureAdjustment=pressure,
            coachingSignal=self._coaching_signal(user_state),
            cartesia=self._cartesia(user_state),
        )

    def prompt_context(self, state: Optional[CoordinationState]) -> Optional[dict]:
        if not state:
            return None
        return {
            "userState": state.userState,
            "pressureAdjustment": state.pressureAdjustment,
            "recommendedAiTone": state.recommendedAiTone,
            "recommendedResponseLength": state.recommendedResponseLength,
            "shouldAiInterrupt": state.shouldAiInterrupt,
            "instruction": self._prompt_instruction(state),
            "cartesia": state.cartesia.model_dump(),
        }

    def _prompt_instruction(self, state: CoordinationState) -> str:
        if state.userState == "confused":
            return "Ask a shorter clarifying question and reduce pressure."
        if state.userState == "overexplaining":
            return "Interrupt politely and request a concise answer."
        if state.pressureAdjustment == "increase":
            return "Ask a sharper follow-up that tests the next layer of reasoning."
        if state.userState == "rushing":
            return "Slow the exchange down and ask one grounding follow-up."
        if state.userState == "collapsing":
            return "Give a smaller prompt with one clear next step."
        return "Keep the social timing natural and respond in the recommended tone."

    def _tone(self, user_state: UserState) -> str:
        return {
            "confused": "warm, clarifying, low pressure",
            "rushing": "steady, grounding, concise",
            "hesitating": "patient, encouraging, specific",
            "defensive": "calm, firm, non-escalating",
            "overexplaining": "polite, interruptive, focused",
            "collapsing": "gentle, simple, reassuring",
            "improving": "sharper, more challenging, respectful",
            "thinking": "quiet, patient, minimal",
            "calm": "natural, attentive, realistic",
        }[user_state]

    def _coaching_signal(self, user_state: UserState) -> str:
        return {
            "confused": "clarify",
            "rushing": "slow_down",
            "hesitating": "support_structure",
            "defensive": "deescalate",
            "overexplaining": "request_concision",
            "collapsing": "smaller_prompt",
            "improving": "increase_challenge",
            "thinking": "wait",
            "calm": "continue",
        }[user_state]

    def _cartesia(self, user_state: UserState) -> CartesiaCoordination:
        if user_state in {"confused", "collapsing", "hesitating"}:
            return CartesiaCoordination(voiceEmotion="supportive", speakingRate=0.88, intensity=0.45, pauseStyle="longer")
        if user_state in {"rushing", "defensive"}:
            return CartesiaCoordination(voiceEmotion="grounded", speakingRate=0.86, intensity=0.5, pauseStyle="measured")
        if user_state == "improving":
            return CartesiaCoordination(voiceEmotion="challenging", speakingRate=0.96, intensity=0.72, pauseStyle="crisp")
        return CartesiaCoordination(voiceEmotion="attentive", speakingRate=0.92, intensity=0.58, pauseStyle="natural")

    def _default_profile(self, user_id: str) -> VoiceProfile:
        now = utc_now_iso()
        return VoiceProfile(userId=user_id, createdAt=now, updatedAt=now)

    def _words(self, text: str) -> list[str]:
        return re.findall(r"[A-Za-z']+", text.lower())

    def _words_per_minute(self, word_count: int, speech_duration_ms: int) -> float:
        if not speech_duration_ms or speech_duration_ms <= 0:
            return 0
        return word_count / max(speech_duration_ms / 60000, 0.01)

    def _filler_count(self, text: str) -> int:
        words = self._words(text)
        return sum(1 for word in words if word in FILLER_WORDS)

    def _markers(self, text: str, candidates: set[str]) -> list[str]:
        lower = text.lower()
        return sorted({marker for marker in candidates if marker in lower})

    def _pauses_from_word_timings(self, timings: list[WordTiming]) -> list[int]:
        pauses: list[int] = []
        ordered = [item for item in timings if item.startMs is not None and item.endMs is not None]
        for previous, current in zip(ordered, ordered[1:]):
            gap = int(current.startMs or 0) - int(previous.endMs or 0)
            if gap > 120:
                pauses.append(gap)
        return pauses


# TODO: Add a lightweight local classifier once enough consented timing data exists.
