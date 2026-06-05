import csv
import hashlib
import io
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import uuid4

from app.services.ml_classifier_service import predict_pause_type, predict_user_state, recommend_ai_timing_action
from app.utils.timestamps import utc_now_iso


FILLER_PHRASES = ["you know", "i mean", "sort of", "kind of"]
FILLER_WORDS = {"um", "uh", "like", "actually", "basically"}
CONFUSION_MARKERS = ["i don't know", "i’m not sure", "i'm not sure", "maybe", "i guess", "can you repeat", "i'm confused", "i am confused", "what do you mean"]
DEFENSIVENESS_MARKERS = ["that's not true", "that’s not true", "i disagree", "you're wrong", "you’re wrong", "i already said", "obviously"]

TELEMETRY_EXPORT_FIELDS = [
    "anonymousUserId",
    "sessionId",
    "turnId",
    "practiceType",
    "difficulty",
    "language",
    "speechDurationMs",
    "silenceBeforeMs",
    "silenceAfterMs",
    "averagePauseMs",
    "longestPauseMs",
    "wordsPerMinute",
    "wordCount",
    "fillerWordCount",
    "fillerWordRate",
    "repeatedPhraseCount",
    "sentenceCount",
    "averageSentenceLength",
    "interruptionCount",
    "userInterruptedAi",
    "aiInterruptedUser",
    "userTurnIndex",
    "aiTurnIndex",
    "responseLatencyMs",
    "aiWaitedMs",
    "aiResponseLength",
    "cameraEnabled",
    "faceDetected",
    "mouthMovementActivity",
    "visualStillnessMs",
    "lookingAwayScore",
    "headMovementIntensity",
    "pauseDecision",
    "decisionConfidence",
    "recommendedAiTone",
    "recommendedResponseLength",
    "detectedUserState",
    "detectedPressureState",
    "detectedPauseType",
    "detectedConfusion",
    "detectedOverexplaining",
    "detectedDefensiveness",
    "detectedRushing",
    "userCompletedTurn",
    "userAbandonedSession",
    "userClickedRetry",
    "userGeneratedReport",
    "userContinuedNextSession",
    "reportScoreConfidence",
    "reportScoreReasoning",
    "reportScoreClarity",
]


class TelemetryService:
    def __init__(self, store: Any) -> None:
        self.store = store

    async def extract_turn_features(self, payload: dict) -> dict:
        user_id = str(payload.get("userId") or "guest")
        speech_profile = await self.get_personal_speech_profile(user_id)
        transcript = str(payload.get("transcript") or "")
        words = self._words(transcript)
        word_count = len(words)
        speech_duration_ms = self._int(payload.get("speechDurationMs"))
        silence_before_ms = self._int(payload.get("silenceBeforeMs", payload.get("silenceMs", 0)))
        silence_after_ms = self._int(payload.get("silenceAfterMs", payload.get("silenceMs", 0)))
        pauses = [self._int(item) for item in payload.get("pausesMs", []) if self._int(item) > 0]
        if not pauses and payload.get("wordTimings"):
            pauses = self._pauses_from_word_timings(payload.get("wordTimings") or [])
        average_pause_ms = round(sum(pauses) / max(1, len(pauses))) if pauses else silence_after_ms
        longest_pause_ms = max(pauses) if pauses else silence_after_ms
        filler_count = self._filler_count(transcript)
        sentence_count = max(1, len(re.findall(r"[.!?]+", transcript)) or (1 if transcript.strip() else 0))
        repeated_phrase_count = self._repeated_phrase_count(words)
        confusion_markers = self._marker_count(transcript, CONFUSION_MARKERS)
        defensiveness_markers = self._marker_count(transcript, DEFENSIVENESS_MARKERS)
        words_per_minute = word_count / max(speech_duration_ms / 60000, 0.01) if speech_duration_ms else 0
        filler_rate = filler_count / max(1, word_count)
        average_sentence_length = word_count / max(1, sentence_count)
        interruption_count = self._int(payload.get("interruptionCount"))
        ai_response = str(payload.get("aiResponseText") or "")

        classifier_features = {
            "silenceMs": silence_after_ms,
            "silenceBeforeMs": silence_before_ms,
            "silenceAfterMs": silence_after_ms,
            "speechDurationMs": speech_duration_ms,
            "wordsPerMinute": words_per_minute,
            "lastWords": " ".join(words[-8:]),
            "fillerRate": filler_rate,
            "wordCount": word_count,
            "responseLength": word_count,
            "averagePauseMs": average_pause_ms,
            "confusionMarkers": confusion_markers,
            "defensivenessMarkers": defensiveness_markers,
            "baselineAverageWordsPerMinute": speech_profile.get("averageWordsPerMinute"),
            "baselineAveragePauseMs": speech_profile.get("averagePauseMs"),
            "baselineLongPauseThresholdMs": speech_profile.get("longPauseThresholdMs"),
            "baselineFillerWordRate": speech_profile.get("fillerWordRate"),
            "baselineAverageTurnWordCount": speech_profile.get("averageTurnWordCount"),
        }
        pause_type = str(payload.get("detectedPauseType") or predict_pause_type(classifier_features))
        user_state = str(payload.get("detectedUserState") or payload.get("currentDetectedState") or predict_user_state(classifier_features))
        timing_action = recommend_ai_timing_action({**classifier_features, "pauseType": pause_type, "userState": user_state})

        detected_confusion = confusion_markers > 0 or user_state == "confused"
        detected_defensiveness = defensiveness_markers > 0 or user_state == "defensive"
        overexplaining_threshold = max(140, int(speech_profile.get("averageTurnWordCount", 55) * 2.25))
        rushing_threshold = max(160, float(speech_profile.get("averageWordsPerMinute", 125)) * 1.35)
        fast_pause_threshold = max(500, int(speech_profile.get("averagePauseMs", 900) * 0.72))
        detected_overexplaining = word_count > overexplaining_threshold or speech_duration_ms > 90000 or repeated_phrase_count >= 3 or user_state == "overexplaining"
        detected_rushing = (words_per_minute > rushing_threshold and average_pause_ms < fast_pause_threshold) or user_state == "rushing"

        return {
            "speechStartAt": payload.get("speechStartAt"),
            "speechEndAt": payload.get("speechEndAt"),
            "speechDurationMs": speech_duration_ms,
            "silenceBeforeMs": silence_before_ms,
            "silenceAfterMs": silence_after_ms,
            "averagePauseMs": average_pause_ms,
            "longestPauseMs": longest_pause_ms,
            "wordsPerMinute": round(words_per_minute, 2),
            "wordCount": word_count,
            "fillerWordCount": filler_count,
            "fillerWordRate": round(filler_rate, 4),
            "repeatedPhraseCount": repeated_phrase_count,
            "sentenceCount": sentence_count,
            "averageSentenceLength": round(average_sentence_length, 2),
            "interruptionCount": interruption_count,
            "userInterruptedAi": bool(payload.get("userInterruptedAi", False)),
            "aiInterruptedUser": bool(payload.get("aiInterruptedUser", False)),
            "userTurnIndex": self._int(payload.get("userTurnIndex", payload.get("turnIndex", 0))),
            "aiTurnIndex": self._int(payload.get("aiTurnIndex", payload.get("turnIndex", 0))),
            "responseLatencyMs": self._int(payload.get("responseLatencyMs")),
            "aiWaitedMs": self._int(payload.get("aiWaitedMs")),
            "aiResponseLength": len(self._words(ai_response)) if ai_response else self._int(payload.get("aiResponseLength")),
            "cameraEnabled": bool(payload.get("cameraEnabled", False)),
            "faceDetected": bool(payload.get("faceDetected", False)),
            "mouthMovementActivity": float(payload.get("mouthMovementActivity") or 0),
            "visualStillnessMs": self._int(payload.get("visualStillnessMs")),
            "lookingAwayScore": float(payload.get("lookingAwayScore") or 0),
            "headMovementIntensity": float(payload.get("headMovementIntensity") or 0),
            "pauseDecision": payload.get("pauseDecision"),
            "decisionConfidence": payload.get("decisionConfidence"),
            "recommendedAiTone": payload.get("recommendedAiTone") or payload.get("aiActionTaken") or timing_action,
            "recommendedResponseLength": payload.get("recommendedResponseLength") or self._recommended_response_length(user_state),
            "detectedUserState": user_state,
            "detectedPressureState": payload.get("detectedPressureState") or self._pressure_state(payload.get("difficulty"), user_state),
            "detectedPauseType": pause_type,
            "detectedConfusion": detected_confusion,
            "detectedOverexplaining": detected_overexplaining,
            "detectedDefensiveness": detected_defensiveness,
            "detectedRushing": detected_rushing,
            "personalBaseline": {
                "sampleCount": speech_profile.get("sampleCount", 0),
                "averageWordsPerMinute": speech_profile.get("averageWordsPerMinute"),
                "averagePauseMs": speech_profile.get("averagePauseMs"),
                "fillerWordRate": speech_profile.get("fillerWordRate"),
                "averageTurnWordCount": speech_profile.get("averageTurnWordCount"),
            },
        }

    async def save_turn_telemetry(self, payload: dict) -> Optional[dict]:
        user_id = str(payload.get("userId") or "guest")
        settings = await self.store.get_user_privacy_settings(user_id)
        if not settings.get("allowTelemetry", True) or not settings.get("allowModelImprovement", True):
            return None

        telemetry_id = str(payload.get("telemetryId") or uuid4())
        features = await self.extract_turn_features(payload)
        record = {
            "telemetryId": telemetry_id,
            "userId": user_id,
            "sessionId": payload.get("sessionId", ""),
            "turnId": payload.get("turnId") or telemetry_id,
            "practiceType": payload.get("practiceType", ""),
            "difficulty": payload.get("difficulty", ""),
            "language": payload.get("language", "en"),
            "timestamp": payload.get("timestamp") or utc_now_iso(),
            **features,
            "userCompletedTurn": bool(payload.get("userCompletedTurn", True)),
            "userAbandonedSession": bool(payload.get("userAbandonedSession", False)),
            "userClickedRetry": bool(payload.get("userClickedRetry", False)),
            "userGeneratedReport": bool(payload.get("userGeneratedReport", False)),
            "userContinuedNextSession": bool(payload.get("userContinuedNextSession", False)),
            "reportScoreConfidence": payload.get("reportScoreConfidence"),
            "reportScoreReasoning": payload.get("reportScoreReasoning"),
            "reportScoreClarity": payload.get("reportScoreClarity"),
            "telemetryConsent": True,
            "rawAudioStored": bool(settings.get("allowRawAudioStorage", False) and payload.get("rawAudioStored", False)),
            "retainForTraining": bool(payload.get("retainForTraining", settings.get("allowModelImprovement", True))),
            "anonymized": bool(payload.get("anonymized", False)),
            "createdAt": utc_now_iso(),
            "expiresAt": payload.get("expiresAt") or self._expires_at(days=30),
        }
        saved = await self.store.save_conversation_telemetry(record)
        return saved

    async def save_local_signal_telemetry(self, payload: dict) -> Optional[dict]:
        user_id = str(payload.get("userId") or "guest")
        settings = await self.store.get_user_privacy_settings(user_id)
        if not settings.get("allowCameraAssistedTiming", False) or not settings.get("allowLocalSignalTelemetry", False):
            return None
        telemetry_id = str(payload.get("telemetryId") or uuid4())
        record = {
            "telemetryId": telemetry_id,
            "userId": user_id,
            "sessionId": payload.get("sessionId", ""),
            "timestamp": payload.get("timestamp") or utc_now_iso(),
            "cameraEnabled": bool(payload.get("cameraEnabled", False)),
            "faceDetected": bool(payload.get("faceDetected", False)),
            "mouthMovementActivity": float(payload.get("mouthMovementActivity") or 0),
            "visualStillnessMs": self._int(payload.get("visualStillnessMs")),
            "lookingAwayScore": float(payload.get("lookingAwayScore") or 0),
            "headMovementIntensity": float(payload.get("headMovementIntensity") or 0),
            "silenceMs": self._int(payload.get("silenceMs")),
            "speechDurationMs": self._int(payload.get("speechDurationMs")),
            "pauseDecision": payload.get("pauseDecision", ""),
            "decisionConfidence": float(payload.get("decisionConfidence") or 0),
            "userContinuedAfterDecision": bool(payload.get("userContinuedAfterDecision", False)),
            "aiInterruptedTooEarly": bool(payload.get("aiInterruptedTooEarly", False)),
            "createdAt": utc_now_iso(),
            "expiresAt": payload.get("expiresAt") or self._expires_at(days=30),
        }
        saved = await self.store.save_local_signal_telemetry(record)
        await self.update_local_signal_profile(user_id, record)
        return saved

    async def update_local_signal_profile(self, user_id: str, telemetry: dict) -> dict:
        if user_id == "guest":
            return await self.get_personal_speech_profile(user_id)
        current = await self.get_personal_speech_profile(user_id)
        sample_count = int(current.get("localSignalSampleCount") or 0)
        alpha = 1 if sample_count == 0 else 0.18

        def ema(key: str, next_value: float) -> float:
            previous = float(current.get(key) or 0)
            return round((previous * (1 - alpha)) + (next_value * alpha), 4)

        next_profile = {
            **current,
            "cameraAssistedTimingEnabled": True,
            "localSignalSampleCount": sample_count + 1,
            "adjustedLongPauseThresholdMs": max(1800, min(9000, int((current.get("longPauseThresholdMs") or 3400) * 1.05))),
            "averageVisualThinkingPauseMs": int(ema("averageVisualThinkingPauseMs", float(telemetry.get("visualStillnessMs") or 0))),
            "typicalMouthActivityBeforeContinue": ema("typicalMouthActivityBeforeContinue", float(telemetry.get("mouthMovementActivity") or 0)),
            "typicalGazeShiftDuringThinking": ema("typicalGazeShiftDuringThinking", float(telemetry.get("lookingAwayScore") or 0)),
            "updatedAt": utc_now_iso(),
        }
        return await self.store.save_voice_profile(next_profile)

    async def get_local_signal_diagnostics(self) -> dict:
        records = await self.store.list_local_signal_telemetry(limit_count=1000)
        decisions: dict[str, int] = {}
        for record in records:
            decision = str(record.get("pauseDecision") or "unknown")
            decisions[decision] = decisions.get(decision, 0) + 1

        def avg(key: str) -> float:
            values = [float(record.get(key) or 0) for record in records]
            return round(sum(values) / max(1, len(values)), 4)

        continued = sum(1 for record in records if record.get("userContinuedAfterDecision"))
        early = sum(1 for record in records if record.get("aiInterruptedTooEarly"))
        return {
            "totalRecords": len(records),
            "cameraEnabledRecords": sum(1 for record in records if record.get("cameraEnabled")),
            "faceDetectedRecords": sum(1 for record in records if record.get("faceDetected")),
            "optOutCount": await self.store.count_local_signal_opt_outs(),
            "decisionCounts": decisions,
            "averages": {
                "mouthMovementActivity": avg("mouthMovementActivity"),
                "visualStillnessMs": avg("visualStillnessMs"),
                "lookingAwayScore": avg("lookingAwayScore"),
                "headMovementIntensity": avg("headMovementIntensity"),
                "silenceMs": avg("silenceMs"),
                "speechDurationMs": avg("speechDurationMs"),
                "decisionConfidence": avg("decisionConfidence"),
            },
            "accuracyProxy": {
                "continuedAfterWaitRate": round(continued / max(1, len(records)), 4),
                "possibleEarlyInterruptRate": round(early / max(1, len(records)), 4),
            },
        }

    async def save_session_outcome(self, payload: dict) -> Optional[dict]:
        user_id = str(payload.get("userId") or "guest")
        settings = await self.store.get_user_privacy_settings(user_id)
        if not settings.get("allowTelemetry", True):
            return None
        outcome_id = str(payload.get("outcomeId") or uuid4())
        outcome = {
            "outcomeId": outcome_id,
            "userId": user_id,
            "sessionId": payload.get("sessionId", ""),
            "practiceType": payload.get("practiceType", ""),
            "difficulty": payload.get("difficulty", ""),
            "completed": bool(payload.get("completed", False)),
            "abandoned": bool(payload.get("abandoned", False)),
            "totalTurns": self._int(payload.get("totalTurns")),
            "totalDurationMs": self._int(payload.get("totalDurationMs")),
            "averageConfidenceScore": payload.get("averageConfidenceScore"),
            "averageReasoningScore": payload.get("averageReasoningScore"),
            "averageClarityScore": payload.get("averageClarityScore"),
            "pressureRecoveryScore": payload.get("pressureRecoveryScore"),
            "userReturnedWithin7Days": bool(payload.get("userReturnedWithin7Days", False)),
            "userStartedAnotherSession": bool(payload.get("userStartedAnotherSession", False)),
            "createdAt": utc_now_iso(),
        }
        saved = await self.store.save_session_outcome(outcome)
        await self.update_session_summary_profile(user_id, str(payload.get("sessionId") or ""))
        return saved

    async def get_user_telemetry_summary(self, user_id: str) -> dict:
        records = await self.store.list_conversation_telemetry(user_id=user_id, limit_count=100)
        speech_profile = await self.get_personal_speech_profile(user_id)
        states: dict[str, int] = {}
        pauses: dict[str, int] = {}
        for record in records:
            states[str(record.get("detectedUserState", "unknown"))] = states.get(str(record.get("detectedUserState", "unknown")), 0) + 1
            pauses[str(record.get("detectedPauseType", "unknown"))] = pauses.get(str(record.get("detectedPauseType", "unknown")), 0) + 1
        return {
            "userId": user_id,
            "turnsCollected": len(records),
            "averageWordsPerMinute": round(sum(float(item.get("wordsPerMinute") or 0) for item in records) / max(1, len(records)), 2),
            "averageFillerRate": round(sum(float(item.get("fillerWordRate") or 0) for item in records) / max(1, len(records)), 4),
            "states": states,
            "pauseTypes": pauses,
            "personalSpeechProfile": speech_profile,
        }

    async def get_personal_speech_profile(self, user_id: str) -> dict:
        profile = await self.store.get_voice_profile(user_id) or {}
        now = utc_now_iso()
        defaults = {
            "userId": user_id,
            "sampleCount": 0,
            "averageWordsPerMinute": float(profile.get("averageWordsPerMinute") or 125),
            "averagePauseMs": int(profile.get("averagePauseMs") or 900),
            "longPauseThresholdMs": int(profile.get("longPauseThresholdMs") or 3200),
            "shortPauseThresholdMs": int(profile.get("shortPauseThresholdMs") or 450),
            "averageSilenceAfterMs": int(profile.get("averageSilenceAfterMs") or profile.get("averagePauseMs") or 900),
            "averageSpeechDurationMs": int(profile.get("averageSpeechDurationMs") or 20000),
            "averageTurnWordCount": int(profile.get("averageTurnWordCount") or 45),
            "fillerWordRate": float(profile.get("fillerWordRate") or 0),
            "hesitationMarkerRate": float(profile.get("hesitationMarkerRate") or 0),
            "confusionMarkerRate": float(profile.get("confusionMarkerRate") or 0),
            "defensiveMarkerRate": float(profile.get("defensiveMarkerRate") or profile.get("defensivenessMarkerRate") or 0),
            "defensivenessMarkerRate": float(profile.get("defensivenessMarkerRate") or profile.get("defensiveMarkerRate") or 0),
            "rushingWordsPerMinuteThreshold": float(profile.get("rushingWordsPerMinuteThreshold") or 170),
            "thinkingPauseMs": int(profile.get("thinkingPauseMs") or 1800),
            "overExplainWordThreshold": int(profile.get("overExplainWordThreshold") or profile.get("overexplainingWordCountThreshold") or 140),
            "overexplainingWordCountThreshold": int(profile.get("overexplainingWordCountThreshold") or profile.get("overExplainWordThreshold") or 140),
            "preferredAiWaitMs": int(profile.get("preferredAiWaitMs") or 900),
            "cameraAssistedTimingEnabled": bool(profile.get("cameraAssistedTimingEnabled", False)),
            "adjustedLongPauseThresholdMs": int(profile.get("adjustedLongPauseThresholdMs") or profile.get("longPauseThresholdMs") or 3200),
            "averageVisualThinkingPauseMs": int(profile.get("averageVisualThinkingPauseMs") or 0),
            "typicalMouthActivityBeforeContinue": float(profile.get("typicalMouthActivityBeforeContinue") or 0),
            "typicalGazeShiftDuringThinking": float(profile.get("typicalGazeShiftDuringThinking") or 0),
            "localSignalSampleCount": int(profile.get("localSignalSampleCount") or 0),
            "sessionCount": int(profile.get("sessionCount") or 0),
            "createdAt": profile.get("createdAt") or now,
            "updatedAt": profile.get("updatedAt") or now,
        }
        return {**defaults, **profile}

    async def update_personal_speech_profile(self, user_id: str, telemetry: dict) -> dict:
        if user_id == "guest" or int(telemetry.get("wordCount") or 0) < 3:
            return await self.get_personal_speech_profile(user_id)
        current = await self.get_personal_speech_profile(user_id)
        sample_count = int(current.get("sampleCount") or 0)
        alpha = 1 if sample_count == 0 else 0.18
        next_count = sample_count + 1

        def ema(key: str, next_value: float) -> float:
            previous = float(current.get(key) or 0)
            return round((previous * (1 - alpha)) + (next_value * alpha), 4)

        avg_wpm = ema("averageWordsPerMinute", float(telemetry.get("wordsPerMinute") or current.get("averageWordsPerMinute") or 125))
        avg_pause = int(ema("averagePauseMs", float(telemetry.get("averagePauseMs") or current.get("averagePauseMs") or 900)))
        avg_silence_after = int(ema("averageSilenceAfterMs", float(telemetry.get("silenceAfterMs") or current.get("averageSilenceAfterMs") or avg_pause)))
        avg_speech_duration = int(ema("averageSpeechDurationMs", float(telemetry.get("speechDurationMs") or current.get("averageSpeechDurationMs") or 20000)))
        avg_turn_words = int(ema("averageTurnWordCount", float(telemetry.get("wordCount") or current.get("averageTurnWordCount") or 45)))
        filler_rate = ema("fillerWordRate", float(telemetry.get("fillerWordRate") or 0))
        confusion_rate = ema("confusionMarkerRate", 1.0 if telemetry.get("detectedConfusion") else 0.0)
        defensiveness_rate = ema("defensivenessMarkerRate", 1.0 if telemetry.get("detectedDefensiveness") else 0.0)

        next_profile = {
            **current,
            "userId": user_id,
            "sampleCount": next_count,
            "averageWordsPerMinute": avg_wpm,
            "averagePauseMs": avg_pause,
            "longPauseThresholdMs": max(1800, min(8000, int(avg_pause * 2.4))),
            "shortPauseThresholdMs": max(250, min(1200, int(avg_pause * 0.55))),
            "averageSilenceAfterMs": avg_silence_after,
            "averageSpeechDurationMs": avg_speech_duration,
            "averageTurnWordCount": avg_turn_words,
            "fillerWordRate": filler_rate,
            "hesitationMarkerRate": ema("hesitationMarkerRate", 1.0 if telemetry.get("detectedPauseType") == "thinking" else 0.0),
            "confusionMarkerRate": confusion_rate,
            "defensiveMarkerRate": defensiveness_rate,
            "defensivenessMarkerRate": defensiveness_rate,
            "rushingWordsPerMinuteThreshold": round(max(160, avg_wpm * 1.35), 2),
            "thinkingPauseMs": max(900, min(5000, int(avg_pause * 1.35))),
            "overExplainWordThreshold": max(120, int(avg_turn_words * 2.25)),
            "overexplainingWordCountThreshold": max(120, int(avg_turn_words * 2.25)),
            "preferredAiWaitMs": max(500, min(2400, int(avg_pause * 0.95))),
            "lastPracticeType": telemetry.get("practiceType") or current.get("lastPracticeType"),
            "lastLanguage": telemetry.get("language") or current.get("lastLanguage", "en"),
            "updatedAt": utc_now_iso(),
        }
        return await self.store.save_voice_profile(next_profile)

    async def update_session_summary_profile(self, user_id: str, session_id: str) -> dict:
        if user_id == "guest" or not session_id:
            return await self.get_personal_speech_profile(user_id)
        records = await self.store.list_conversation_telemetry(user_id=user_id, session_id=session_id, limit_count=200)
        if not records:
            return await self.get_personal_speech_profile(user_id)
        current = await self.get_personal_speech_profile(user_id)
        session_count = int(current.get("sessionCount") or 0)
        alpha = 1 if session_count == 0 else 0.28

        def avg(key: str) -> float:
            values = [float(record.get(key) or 0) for record in records if record.get(key) is not None]
            return sum(values) / max(1, len(values))

        def rate(key: str) -> float:
            return sum(1 for record in records if record.get(key)) / max(1, len(records))

        def value_rate(key: str, value: str) -> float:
            return sum(1 for record in records if record.get(key) == value) / max(1, len(records))

        def ema(current_key: str, next_value: float) -> float:
            return round(float(current.get(current_key) or 0) * (1 - alpha) + next_value * alpha, 4)

        avg_wpm = ema("averageWordsPerMinute", avg("wordsPerMinute"))
        avg_pause = int(ema("averagePauseMs", avg("averagePauseMs")))
        avg_turn_words = int(ema("averageTurnWordCount", avg("wordCount")))
        filler_rate = ema("fillerWordRate", avg("fillerWordRate"))
        hesitation_rate = ema("hesitationMarkerRate", value_rate("detectedPauseType", "thinking"))
        confusion_rate = ema("confusionMarkerRate", rate("detectedConfusion"))
        defensive_rate = ema("defensiveMarkerRate", rate("detectedDefensiveness"))
        next_profile = {
            **current,
            "userId": user_id,
            "averageWordsPerMinute": avg_wpm,
            "averagePauseMs": avg_pause,
            "longPauseThresholdMs": max(1800, min(8000, int(avg_pause * 2.4))),
            "fillerWordRate": filler_rate,
            "overExplainWordThreshold": max(120, int(avg_turn_words * 2.25)),
            "overexplainingWordCountThreshold": max(120, int(avg_turn_words * 2.25)),
            "hesitationMarkerRate": hesitation_rate,
            "confusionMarkerRate": confusion_rate,
            "defensiveMarkerRate": defensive_rate,
            "defensivenessMarkerRate": defensive_rate,
            "averageTurnWordCount": avg_turn_words,
            "averageAnswerDurationMs": int(ema("averageSpeechDurationMs", avg("speechDurationMs"))),
            "averageSpeechDurationMs": int(ema("averageSpeechDurationMs", avg("speechDurationMs"))),
            "averageSilenceBeforeContinuingMs": int(ema("averageSilenceAfterMs", avg("silenceAfterMs"))),
            "averageSilenceAfterMs": int(ema("averageSilenceAfterMs", avg("silenceAfterMs"))),
            "sessionCount": session_count + 1,
            "lastSessionId": session_id,
            "updatedAt": utc_now_iso(),
        }
        return await self.store.save_voice_profile(next_profile)

    def anonymize_telemetry_record(self, record: dict) -> dict:
        anonymized = {key: record.get(key) for key in TELEMETRY_EXPORT_FIELDS if key != "anonymousUserId"}
        anonymized["anonymousUserId"] = self._anonymous_user_id(str(record.get("userId", "")))
        return anonymized

    async def export_training_dataset(self, export_format: str = "jsonl", limit_count: int = 1000) -> tuple[str, str]:
        records = await self.store.list_conversation_telemetry(limit_count=limit_count)
        anonymized = [self.anonymize_telemetry_record(record) for record in records]
        if export_format == "csv":
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=TELEMETRY_EXPORT_FIELDS)
            writer.writeheader()
            writer.writerows(anonymized)
            return output.getvalue(), "text/csv"
        lines = [self._json_dumps(item) for item in anonymized]
        return "\n".join(lines) + ("\n" if lines else ""), "application/x-ndjson"

    def _json_dumps(self, payload: dict) -> str:
        import json

        return json.dumps(payload, ensure_ascii=False, sort_keys=True)

    def _anonymous_user_id(self, user_id: str) -> str:
        return hashlib.sha256(f"rehearseai-telemetry:{user_id}".encode("utf-8")).hexdigest()[:24]

    def _words(self, text: str) -> list[str]:
        return re.findall(r"[A-Za-z']+", text.lower())

    def _int(self, value: Any) -> int:
        try:
            return max(0, int(value or 0))
        except (TypeError, ValueError):
            return 0

    def _filler_count(self, text: str) -> int:
        lower = text.lower()
        words = self._words(lower)
        phrase_count = sum(lower.count(phrase) for phrase in FILLER_PHRASES)
        return phrase_count + sum(1 for word in words if word in FILLER_WORDS)

    def _marker_count(self, text: str, markers: list[str]) -> int:
        lower = text.lower()
        return sum(1 for marker in markers if marker in lower)

    def _pauses_from_word_timings(self, timings: list[dict]) -> list[int]:
        pauses: list[int] = []
        ordered = [item for item in timings if item.get("startMs") is not None and item.get("endMs") is not None]
        for previous, current in zip(ordered, ordered[1:]):
            gap = int(current.get("startMs") or 0) - int(previous.get("endMs") or 0)
            if gap > 120:
                pauses.append(gap)
        return pauses

    def _repeated_phrase_count(self, words: list[str]) -> int:
        phrases: dict[str, int] = {}
        for index in range(0, max(0, len(words) - 2)):
            phrase = " ".join(words[index:index + 3])
            phrases[phrase] = phrases.get(phrase, 0) + 1
        return sum(1 for count in phrases.values() if count > 1)

    def _recommended_response_length(self, user_state: str) -> str:
        if user_state in {"confused", "rushing", "hesitant"}:
            return "micro"
        if user_state == "overexplaining":
            return "short"
        return "medium"

    def _pressure_state(self, difficulty: Any, user_state: str) -> str:
        if user_state in {"confused", "defensive", "rushing"}:
            return "high"
        if str(difficulty).lower() == "brutal":
            return "elevated"
        return "stable"

    def _expires_at(self, days: int) -> str:
        return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
