from app.models.message import Message
from app.models.session import Session
from app.prompts.report_prompts import REPORT_SCHEMA
from app.prompts.roleplay_prompts import DIFFICULTY_BEHAVIOR, PERSONAS
from typing import Optional

LANGUAGE_NAMES = {
    "en": "English",
    "ar": "Arabic",
    "ur": "Urdu",
    "hi": "Hindi",
    "es": "Spanish",
    "fr": "French",
}


def build_roleplay_prompt(session: Session, history: list[Message], max_history_messages: int = 8, coordination_context: Optional[dict] = None) -> str:
    turns = "\n".join([f"{message.role.upper()}: {message.content}" for message in history[-max_history_messages:]])
    persona = PERSONAS[session.practiceType]
    difficulty = DIFFICULTY_BEHAVIOR[session.difficulty]
    practice_language = LANGUAGE_NAMES.get(session.practiceLanguage, "English")
    user_turns = [message.content.lower() for message in history if message.role == "user"]
    joined = " ".join(user_turns)
    filler_count = sum(joined.count(word) for word in ["um", "uh", "like", "basically", "actually", "just"])
    generic_count = sum(joined.count(word) for word in ["stuff", "things", "good", "some", "many", "probably"])
    evidence_count = sum(joined.count(word) for word in ["because", "example", "result", "data", "measured"])
    avg_words = round(sum(len(turn.split()) for turn in user_turns) / max(1, len(user_turns)))
    adaptation = "Maintain balanced pressure and ask for precise evidence."
    if filler_count > 3 or avg_words > 55:
        adaptation = "The user may be rushing or over-explaining. Interrupt politely, force a shorter answer, and ask for the core point."
    if generic_count > evidence_count:
        adaptation = "Answers are becoming generic. Become more skeptical and ask for a concrete example or measurable proof."
    if evidence_count >= 3 and avg_words < 50:
        adaptation = "The user is performing strongly. Increase conceptual depth and ask a sharper second-order follow-up."
    if session.difficulty == "Brutal":
        adaptation += " In brutal mode, interruptions are allowed, but keep them professional and never abusive."
    if session.difficulty == "Nerve":
        adaptation += " In Nerve Mode, do not coach. Cross-examine the user's idea and expose weak logic, missing evidence, unsupported assumptions, and feasibility risk."
    coordination_block = "No live conversation coordination context provided."
    if coordination_context:
        coordination_block = f"""
- userState: {coordination_context.get("userState")}
- pressureAdjustment: {coordination_context.get("pressureAdjustment")}
- recommendedAiTone: {coordination_context.get("recommendedAiTone")}
- recommendedResponseLength: {coordination_context.get("recommendedResponseLength")}
- shouldAiInterrupt: {coordination_context.get("shouldAiInterrupt")}
- pauseDecision: {coordination_context.get("pauseDecision")}
- userStateApprox: {coordination_context.get("userStateApprox")}
- adjustedWaitMs: {coordination_context.get("adjustedWaitMs")}
- cameraAssisted: {coordination_context.get("cameraAssisted")}
- instruction: {coordination_context.get("instruction")}
- future Cartesia delivery: {coordination_context.get("cartesia")}
- nerve cross-examination: {coordination_context.get("nerve")}
"""
    return f"""
Run a Cognitive Performance Training pressure simulation. Reply only as the counterpart, not as a coach.

Persona:
{persona}

Difficulty:
{difficulty}

Scenario:
- Practice type: {session.practiceType}
- Topic: {session.topic}
- Context: {session.context}
- User goal: {session.goal}
- Optional notes: {session.optionalNotes or "None"}
- Practice language: {practice_language}
- Nerve entry type: {session.nerveEntryType or "None"}
- Nerve panel persona: {session.nervePersona or "None"}
- Nerve material: {session.nerveMaterialName or "None"}
- Nerve pressure level: {session.pressureLevel}/10

Adaptive behavior signals:
- User turns: {len(user_turns)}
- Filler markers: {filler_count}
- Generic/vague markers: {generic_count}
- Evidence markers: {evidence_count}
- Average words per user turn: {avg_words}
- Adaptation instruction: {adaptation}

Conversation coordination instructions:
{coordination_block}

Apply coordination before writing the response:
- If userState is confused, ask a shorter clarifying question.
- If userState is overexplaining, interrupt politely and request a concise answer.
- If pressureAdjustment is increase, ask a sharper follow-up.
- If pressureAdjustment is decrease, soften pressure without dropping realism.
- If nerve cross-examination is present, follow its instruction first. Nerve Mode is not coaching: ask hard objections, expose the weakest assumption, and require evidence. If shouldInterrupt is true, begin with a short interruption such as "That does not answer the question" or "Where is your evidence?"

Conversation so far:
{turns}

Reply in character in 1-3 sentences in {practice_language}. Ask one pointed follow-up or objection.
Respond directly to the user's latest words; do not repeat generic goal reminders, slogans, or the same coaching phrase across turns.
Use natural emotion appropriate to the role: curious, skeptical, concerned, impatient, warm, or impressed. Vary sentence openings and rhythm.
Adapt pressure dynamically based on the user's behavior. Challenge vague logic, probe unsupported assumptions, and increase depth when performance is strong. If the user appears overwhelmed, soften the tone slightly while staying realistic. Never be abusive. Do not give a feedback report yet.
"""


def build_opening_prompt(session: Session) -> str:
    persona = PERSONAS[session.practiceType]
    difficulty = DIFFICULTY_BEHAVIOR[session.difficulty]
    practice_language = LANGUAGE_NAMES.get(session.practiceLanguage, "English")
    return f"""
Start a Cognitive Performance Training pressure simulation. You are the counterpart, not the coach.

Persona:
{persona}

Difficulty:
{difficulty}

Scenario:
- Practice type: {session.practiceType}
- Topic: {session.topic}
- Context: {session.context}
- User goal: {session.goal}
- Optional notes: {session.optionalNotes or "None"}
- Practice language: {practice_language}
- Nerve entry type: {session.nerveEntryType or "None"}
- Nerve panel persona: {session.nervePersona or "None"}
- Nerve material: {session.nerveMaterialName or "None"}
- Nerve pressure level: {session.pressureLevel}/10

Open the discussion in character in 1-2 sentences in {practice_language}.
Ask the user the first realistic question or objection. Do not explain the product. Do not give generic advice. Do not say "stay focused on your goal."
Use a natural emotional tone appropriate to the role.
"""


def build_report_prompt(session: Session, history: list[Message]) -> str:
    turns = "\n".join([f"{message.role.upper()}: {message.content}" for message in history])
    practice_language = LANGUAGE_NAMES.get(session.practiceLanguage, "English")
    feedback_language = LANGUAGE_NAMES.get(session.feedbackLanguage, "English")
    english_esl = session.practiceLanguage == "en" and session.feedbackLanguage != "en"
    return f"""
Create a structured RehearseAI feedback report for this completed practice session.

Practice type: {session.practiceType}
Difficulty: {session.difficulty}
Topic: {session.topic}
Context: {session.context}
Goal: {session.goal}
Practice language: {practice_language}
Feedback language: {feedback_language}
Nerve entry type: {session.nerveEntryType or "None"}
Nerve panel persona: {session.nervePersona or "None"}
Nerve pressure level reached: {session.pressureLevel}/10

Write every user-facing field in the JSON report in {feedback_language}.
If the practice language is English, include practical second-language coaching inside strengths, weakMoments, improvedResponses, drills, and nextRecommendation when relevant:
- grammar correction
- pronunciation notes placeholder
- better phrasing
- native-sounding alternatives
- confidence coaching
English as second language focus enabled: {english_esl}

Conversation:
{turns}

{REPORT_SCHEMA}
"""
