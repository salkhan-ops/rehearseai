"""Prompts for per-turn coaching and session-level summary generation."""

import json


def build_turn_coaching_prompt(
    practice_type: str,
    ai_speaker: str,
    ai_question: str,
    user_text: str,
    emotion_label: str,
    confidence_score: float,
    wpm: int,
    filler_count: int,
    speech_duration_ms: int,
    silence_before_ms: int,
) -> str:
    confidence_pct = round(confidence_score * 100)
    duration_s = round(speech_duration_ms / 1000, 1)
    silence_s = round(silence_before_ms / 1000, 1)

    return f"""You are an expert {practice_type} coach giving precise, actionable feedback on a single response.

CONTEXT
Practice type: {practice_type}
Interviewer ({ai_speaker}) asked: {ai_question}

WHAT THE CANDIDATE ACTUALLY SAID
"{user_text}"

DELIVERY METRICS
- Emotional delivery: {emotion_label}
- Confidence score: {confidence_pct}%
- Speaking pace: {wpm} words/min (ideal: 120–165)
- Filler words: {filler_count}
- Answer duration: {duration_s}s
- Silence before answering: {silence_s}s

TASK
Return a JSON object with exactly these five keys. Be specific and concise — each value is 1–2 sentences max.

{{
  "betterAnswer": "A stronger version of their opening line or core claim. Rewrite their actual phrasing, not a generic template.",
  "structureTip": "One structural technique they should apply (STAR, lead with result, one-claim rule, etc.).",
  "emotionalGuidance": "What their delivery revealed emotionally and the single adjustment that will fix it.",
  "missedOpportunity": "A concrete detail, number, or pivot they had but didn't use — or 'None' if everything was covered.",
  "toneAdvice": "One physical delivery tip: pace, pause, volume, eye contact, or energy."
}}

Return ONLY valid JSON. No markdown fences, no preamble."""


def build_analysis_summary_prompt(
    practice_type: str,
    turns_json: str,
) -> str:
    return f"""You are an expert {practice_type} coach reviewing a completed session.

Here are all the turns with their emotion metrics and coaching notes:
{turns_json}

Return a JSON object summarising the session performance:
{{
  "avgConfidenceScore": <integer 0-100>,
  "dominantEmotion": "<the most frequent emotion label across turns>",
  "strongestTurn": <0-based index of the best-delivered turn>,
  "weakestTurn": <0-based index of the turn that needs the most work>,
  "topStrengths": ["<strength 1>", "<strength 2>"],
  "topImprovements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}}

Each strength/improvement is one short, specific sentence. Return ONLY valid JSON."""
