"""
Generates per-turn coaching + session summary immediately after a session ends.
Runs all Gemini calls in parallel so the full analysis is ready within ~10 seconds.
"""

import asyncio
import json
import re
from typing import Optional

import google.generativeai as genai

from app.config import get_settings
from app.models.session import Session
from app.models.turn_analysis import (
    AnalysisSummary,
    EmotionSignals,
    SessionAnalysis,
    TurnCoaching,
    TurnEmotion,
    TurnRecord,
)
from app.prompts.analysis_prompts import (
    build_analysis_summary_prompt,
    build_turn_coaching_prompt,
)
from app.services.firestore_service import FirestoreService
from app.utils.timestamps import utc_now_iso


def _parse_json(text: str) -> dict:
    cleaned = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
    return json.loads(cleaned)


def _wpm_to_pace(wpm: int) -> str:
    if wpm < 100:
        return "slow"
    if wpm > 175:
        return "fast"
    return "normal"


def _extract_speaker_from_content(content: str) -> str:
    """Pull the first [Name]: tag from an AI message, e.g. '[Jordan]: ...' → 'Jordan'."""
    match = re.match(r"\[([^\]]+)\]\s*:", content)
    return match.group(1).strip() if match else ""


def _strip_speaker_tags(content: str) -> str:
    return re.sub(r"\[([^\]]+)\]\s*:\s*", "", content).strip()


class SessionAnalysisService:
    def __init__(self) -> None:
        settings = get_settings()
        try:
            genai.configure(api_key=settings.gemini_api_key)
            self._model = genai.GenerativeModel(settings.gemini_model)
        except Exception:
            self._model = None

    async def _call_gemini(self, prompt: str) -> dict:
        if not self._model:
            return {}
        try:
            response = await self._model.generate_content_async(
                prompt,
                generation_config={
                    "max_output_tokens": 512,
                    "temperature": 0.4,
                    "response_mime_type": "application/json",
                },
                request_options={"timeout": 20},
            )
            return _parse_json(response.text or "")
        except Exception:
            return {}

    async def _generate_turn_coaching(
        self,
        practice_type: str,
        turn: TurnRecord,
    ) -> TurnCoaching:
        raw = await self._call_gemini(
            build_turn_coaching_prompt(
                practice_type=practice_type,
                ai_speaker=turn.aiSpeaker,
                ai_question=turn.aiQuestion,
                user_text=turn.userText,
                emotion_label=turn.emotion.label,
                confidence_score=turn.emotion.confidenceScore,
                wpm=turn.emotion.signals.wpm,
                filler_count=turn.emotion.signals.fillerCount,
                speech_duration_ms=turn.speechDurationMs,
                silence_before_ms=turn.silenceBeforeMs,
            )
        )
        return TurnCoaching(
            betterAnswer=raw.get("betterAnswer", ""),
            structureTip=raw.get("structureTip", ""),
            emotionalGuidance=raw.get("emotionalGuidance", ""),
            missedOpportunity=raw.get("missedOpportunity", ""),
            toneAdvice=raw.get("toneAdvice", ""),
        )

    async def _generate_summary(
        self,
        practice_type: str,
        turns: list[TurnRecord],
    ) -> AnalysisSummary:
        turns_data = [
            {
                "turnIndex": t.turnIndex,
                "aiQuestion": t.aiQuestion[:120],
                "userText": t.userText[:200],
                "emotion": t.emotion.label,
                "confidenceScore": round(t.emotion.confidenceScore * 100),
                "wpm": t.emotion.signals.wpm,
                "fillerCount": t.emotion.signals.fillerCount,
                "coaching": t.coaching.model_dump() if t.coaching else {},
            }
            for t in turns
        ]
        raw = await self._call_gemini(
            build_analysis_summary_prompt(
                practice_type=practice_type,
                turns_json=json.dumps(turns_data, indent=2),
            )
        )
        # Compute avg confidence as fallback
        if turns:
            avg = round(sum(t.emotion.confidenceScore for t in turns) / len(turns) * 100)
        else:
            avg = 0
        emotion_counts: dict[str, int] = {}
        for t in turns:
            emotion_counts[t.emotion.label] = emotion_counts.get(t.emotion.label, 0) + 1
        dominant = max(emotion_counts, key=lambda k: emotion_counts[k]) if emotion_counts else "unclear"

        return AnalysisSummary(
            avgConfidenceScore=int(raw.get("avgConfidenceScore", avg)),
            dominantEmotion=raw.get("dominantEmotion", dominant),
            strongestTurn=int(raw.get("strongestTurn", 0)),
            weakestTurn=int(raw.get("weakestTurn", 0)),
            topStrengths=raw.get("topStrengths", []),
            topImprovements=raw.get("topImprovements", []),
        )

    async def generate(
        self,
        session: Session,
        store: FirestoreService,
    ) -> Optional[SessionAnalysis]:
        try:
            messages = await store.get_messages(session.id)

            # Build paired turn records
            turns: list[TurnRecord] = []
            for i, msg in enumerate(messages):
                if msg.role != "user":
                    continue
                # Find the most recent AI message before this one
                ai_msg = next(
                    (m for m in reversed(messages[:i]) if m.role == "ai"),
                    None,
                )
                ai_question = _strip_speaker_tags(ai_msg.content) if ai_msg else ""
                ai_speaker = _extract_speaker_from_content(ai_msg.content) if ai_msg else ""

                meta = msg.metadata or {}
                timing = meta.get("turnTiming") or {}
                emotion_raw = meta.get("speechEmotion") or {}
                signals_raw = emotion_raw.get("signals") or {}

                emotion = TurnEmotion(
                    label=emotion_raw.get("label", "unclear"),
                    confidenceScore=float(emotion_raw.get("confidenceScore", 0.5)),
                    pace=_wpm_to_pace(int(signals_raw.get("wpm", 0))),
                    signals=EmotionSignals(
                        pitchVariancePct=float(signals_raw.get("pitchVariancePct", 0)),
                        pitchMeanHz=float(signals_raw.get("pitchMeanHz", 0)),
                        energyTrend=float(signals_raw.get("energyTrend", 0)),
                        wpm=int(signals_raw.get("wpm", 0)),
                        fillerRatio=float(signals_raw.get("fillerRatio", 0)),
                        fillerCount=int(signals_raw.get("fillerCount", 0)),
                    ),
                )

                turns.append(
                    TurnRecord(
                        turnIndex=len(turns),
                        aiSpeaker=ai_speaker,
                        aiQuestion=ai_question,
                        userText=msg.content,
                        speechDurationMs=int(timing.get("speechDurationMs") or meta.get("speechDurationMs") or 0),
                        silenceBeforeMs=int(timing.get("silenceMs") or meta.get("silenceMs") or 0),
                        emotion=emotion,
                    )
                )

            if not turns:
                return None

            # Generate all turn coachings in parallel
            coaching_tasks = [
                self._generate_turn_coaching(session.practiceType, turn)
                for turn in turns
            ]
            coachings = await asyncio.gather(*coaching_tasks)
            for turn, coaching in zip(turns, coachings):
                turn.coaching = coaching

            # Generate overall summary
            summary = await self._generate_summary(session.practiceType, turns)

            analysis = SessionAnalysis(
                analysisId=session.id,
                sessionId=session.id,
                generatedAt=utc_now_iso(),
                practiceType=session.practiceType,
                difficulty=session.difficulty,
                turns=turns,
                summary=summary,
                status="complete",
            )
            await store.save_session_analysis(analysis.model_dump())
            return analysis

        except Exception:
            # Never block the session end flow
            return None
