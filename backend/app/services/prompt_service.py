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


def narrate_conversation_state(conversation_state: Optional[dict]) -> str:
    if not conversation_state:
        return "[CONVERSATION STATE]\nNo fused multimodal state available."
    audio = conversation_state.get("audio") or {}
    vision = conversation_state.get("vision") or {}
    transcript = conversation_state.get("transcript") or {}
    turn_probability = float(conversation_state.get("turn_complete_probability") or 0)

    affect_parts: list[str] = []
    if float(audio.get("filler_rate") or 0) >= 10:
        affect_parts.append("high filler rate")
    if float(audio.get("volume_rms") or 0) < 0.02:
        affect_parts.append("low volume")
    if bool(audio.get("pitch_rising")):
        affect_parts.append("rising pitch")
    if float(vision.get("confusion_score") or 0) > 0.7:
        affect = "confused or searching"
    elif float(vision.get("speech_readiness") or 0) > 0.7:
        affect = "ready to continue speaking"
    elif affect_parts:
        affect = "hesitant, " + ", ".join(affect_parts[:2])
    else:
        affect = "steady"

    engagement = "present" if float(vision.get("engagement_score") or 0) >= 0.45 else "low"
    engagement_cues = []
    if float(vision.get("gaze_on_camera") or 0) > 0.6:
        engagement_cues.append("gaze on camera")
    if bool(vision.get("head_nodding")):
        engagement_cues.append("nodding")
    if float(vision.get("mouth_aperture") or 0) > 0.3:
        engagement_cues.append("mouth open")
    if not engagement_cues:
        engagement_cues.append("limited visual cues")

    silence_category = str(audio.get("silence_category") or "micro_pause")
    if float(vision.get("speech_readiness") or 0) > 0.7:
        turn_signal = "not complete, user appears ready to continue"
    elif turn_probability > 0.85 and transcript.get("is_final"):
        turn_signal = f"complete, {silence_category.replace('_', ' ')}"
    elif silence_category == "micro_pause":
        turn_signal = "incomplete, micro pause"
    else:
        turn_signal = f"uncertain, {silence_category.replace('_', ' ')}"

    notable = "none"
    if float(vision.get("confusion_score") or 0) > 0.7:
        notable = "confusion signal sustained"
    elif bool(audio.get("volume_rising")) and float(vision.get("mouth_aperture") or 0) > 0.3:
        notable = "user may be starting to speak"

    return (
        "[CONVERSATION STATE]\n"
        f"User affect: {affect}\n"
        f"Engagement: {engagement} ({', '.join(engagement_cues[:2])})\n"
        f"Turn signal: {turn_signal}\n"
        f"Notable: {notable}"
    )


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
        conversation_control = coordination_context.get("conversationControl") or {}
        state_narration = narrate_conversation_state(coordination_context.get("conversationState"))
        coordination_block = f"""
{state_narration}
- userState: {coordination_context.get("userState")}
- pressureAdjustment: {coordination_context.get("pressureAdjustment")}
- recommendedAiTone: {coordination_context.get("recommendedAiTone")}
- recommendedResponseLength: {coordination_context.get("recommendedResponseLength")}
- shouldAiInterrupt: {coordination_context.get("shouldAiInterrupt")}
- conversationControl: {conversation_control}
- stance: {coordination_context.get("stance")}
- pressureLevel: {coordination_context.get("pressureLevel")}
- responseBreakdown: {coordination_context.get("responseBreakdown")}
- likelyCause: {coordination_context.get("likelyCause")}
- aiAction: {coordination_context.get("aiAction")}
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
- Treat conversationControl as the governing control layer for this turn.
- Use the selected stance: supportive, curious, neutral, skeptical, opposing, or hostile. Hostile means professionally adversarial, never abusive.
- Agreement can be pressure: if stance is supportive or neutral and shouldChallenge is true, briefly agree with the reasonable part, then test evidence, implications, or assumptions.
- Opposition should challenge assumptions, evidence, logic, feasibility, consistency, or implications.
- Beginner/Friendly breakdown behavior: clarify, reframe, support, lower pressure, and ask a smaller follow-up.
- Intermediate breakdown behavior: ask a clarifying follow-up and lightly challenge without giving the answer.
- Advanced breakdown behavior: point out vagueness and request evidence.
- Brutal breakdown behavior: directly challenge avoidance and demand clarity while staying professional.
- Nerve breakdown behavior: use panel dynamics when shouldEscalate is true. A second panel voice may interrupt or chain a question, but keep the exchange coherent.
- If safety risk reduced pressure, do not escalate. Avoid aggressive questioning on mental health, self-harm, medical, legal, harmful persuasion, or crisis topics.
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
