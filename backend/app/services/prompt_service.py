from app.models.message import Message
from app.models.session import Session
from app.prompts.report_prompts import REPORT_SCHEMA
from app.prompts.roleplay_prompts import CROSS_MODULE_RULES, DIFFICULTY_BEHAVIOR, DOCUMENT_GUARDRAIL, DOCUMENT_MODES, MODULE_ESCALATION, MODULE_GUARDRAILS, PERSONAS, PROFILE_GUARDRAIL
from app.prompts.panel_prompts import build_panel_block, is_panel_mode
from typing import Optional

LANGUAGE_NAMES = {
    "en": "English",
    "ar": "Arabic",
    "ur": "Urdu",
    "hi": "Hindi",
    "es": "Spanish",
    "fr": "French",
}


def build_reasoning_chain_block(session: Session, history: list[Message], coordination_context: Optional[dict] = None) -> str:
    """Returns a mode-specific reasoning chain instruction for Brutal and Nerve only. Empty string otherwise."""
    mode = session.difficulty
    if mode not in {"Brutal", "Nerve"}:
        return ""

    # Pull the last user turn for context-specific instructions
    user_turns = [m.content for m in history if m.role == "user"]
    last_user = user_turns[-1] if user_turns else ""
    word_count = len(last_user.split())
    has_evidence = any(w in last_user.lower() for w in ["because", "data", "example", "measured", "study", "result", "evidence", "metric", "showed", "found"])
    has_evasion = any(w in last_user.lower() for w in ["it depends", "hard to say", "not sure", "i guess", "maybe", "probably", "generally"])
    overlong = word_count > 80

    # Derive specific attack hints from what the user just said
    attack_note = ""
    if has_evasion:
        attack_note = "The user is currently evading. Call it out sharply in the first sentence before constructing your chain."
    elif overlong and not has_evidence:
        attack_note = "The user is over-explaining without evidence. Your layer-1 attack should name the specific claim buried in the verbosity."
    elif has_evidence:
        attack_note = "The user cited evidence. Your layer-1 attack should challenge the quality, scope, or sourcing of that evidence specifically — not reject it generically."
    else:
        attack_note = "The user made an unsupported assertion. Your layer-1 attack should name the exact claim and the missing proof type."

    nerve_ctx = ""
    if mode == "Nerve" and coordination_context:
        nerve_ctx_raw = coordination_context.get("nerve") or {}
        if isinstance(nerve_ctx_raw, dict):
            attack_surface = nerve_ctx_raw.get("attackSurface") or []
            weakness = nerve_ctx_raw.get("weaknessExposed") or "unknown"
            if attack_surface:
                nerve_ctx = f"\nActive attack surface for this turn: {', '.join(str(a) for a in attack_surface[:3])}.\nExposed weakness: {weakness}.\nPick the attack vector most exposed by the user's last answer."

    if mode == "Brutal":
        return f"""
REASONING CHAIN — BRUTAL MODE (2 layers, mandatory):
Do NOT produce a single direct question. You must construct a two-step reasoning attack in natural prose.

  Layer 1 (surface): Identify the weakest element in the user's last answer — a vague term, a missing metric, an unsupported causal claim, or a circular premise. Name it precisely in one sentence.
  Layer 2 (implication): From that weakness, expose what breaks in the broader argument. Does the conclusion become unsupported? Does a stronger counterexample emerge? Does a hidden dependency get exposed? State this in one sentence.
  Closing question: One sharp question that forces the user to defend both the specific weakness and its implication simultaneously. Do not accept a partial answer.

Attack note: {attack_note}
Total response: 2–3 sentences. On rare occasions when the logical structure genuinely requires it, 4–5 sentences are permitted. No bullet points. No softening. Professionally adversarial throughout.
"""

    if mode == "Nerve":
        return f"""
REASONING CHAIN — NERVE MODE (3 layers, maximum depth, mandatory):
You are cornering the user through a three-layer logical trap. Every layer must build on the one before. Do NOT ask three separate questions. Build toward one devastating closing question.

  Layer 1 (precision attack): Isolate the single claim doing the most work in the user's answer. Attack its exact definition, scope, measurement basis, or sourcing. Be surgical, not general.
  Layer 2 (assumption attack): Name the unstated assumption that claim depends on. The user has not defended this assumption — they may not even know it is there. Surface it explicitly in one sentence.
  Layer 3 (meta-attack): Show that even if the user fixed Layer 2, the conclusion still fails. There is a second-order implication, an alternative causal explanation, a scope error, or a systemic risk they have not addressed. One sentence.
  Closing question: A single question that cannot be answered without addressing all three layers at once. The user should feel the walls closing.

Attack note: {attack_note}{nerve_ctx}
Total response: 3–4 sentences. On rare occasions when a three-layer trap genuinely requires full construction, up to 5 sentences are permitted. No bullet points. No coaching. If the user evades, open with "Evasion." then restate the sharpest unanswered layer as a question.
"""

    return ""


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


def build_document_block(session: Session) -> str:
    if not session.documentText:
        return ""
    doc_mode = session.documentMode or "neutral"
    mode_instruction = DOCUMENT_MODES.get(doc_mode, DOCUMENT_MODES["neutral"])
    guardrail = PROFILE_GUARDRAIL if doc_mode == "profile" else DOCUMENT_GUARDRAIL
    word_count = len(session.documentText.split())
    non_alpha = sum(1 for c in session.documentText if not c.isalpha() and not c.isspace())
    symbol_ratio = non_alpha / max(1, len(session.documentText))
    symbol_note = (
        "\nNote: This document contains significant mathematical or code notation. "
        "Focus on conceptual understanding and reasoning — do not attempt to verify calculations, run code, or solve equations."
    ) if symbol_ratio > 0.15 else ""
    label = "CANDIDATE BACKGROUND DOCUMENT" if doc_mode == "profile" else "DOCUMENT"
    return (
        f"\n{guardrail}\n"
        f"Document mode: {doc_mode.replace('_', ' ').title()}\n"
        f"{mode_instruction}\n\n"
        f"{label} ({word_count} words):\n"
        f"---\n{session.documentText}\n---"
        f"{symbol_note}\n"
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

    # In-conversation pressure escalation — pressure must build turn by turn within ANY conversation
    turn_count = len(user_turns)
    diff = session.difficulty
    if diff in {"Beginner", "Friendly"}:
        turn_pressure_note = f"Turn {turn_count}: stay warm and patient. A small challenge is fine only if the user is performing well."
    elif diff == "Intermediate":
        if turn_count <= 3:
            turn_pressure_note = f"Turn {turn_count} (opening): stay conversational and curious. Probe once."
        elif turn_count <= 6:
            turn_pressure_note = f"Turn {turn_count} (building): raise skepticism noticeably. Push for evidence."
        else:
            turn_pressure_note = f"Turn {turn_count} (late): be sharper than you were at the start — the user should feel this conversation has escalated."
    elif diff == "Advanced":
        if turn_count <= 3:
            turn_pressure_note = f"Turn {turn_count} (opening): establish high expectations. Professional and probing."
        elif turn_count <= 6:
            turn_pressure_note = f"Turn {turn_count} (building): push for precise evidence. Sharper language. Light sarcasm is fine."
        else:
            turn_pressure_note = f"Turn {turn_count} (late): maximum scrutiny. Precision attacks, sharper wit — the hardest point in the conversation."
    elif diff == "Brutal":
        if turn_count <= 2:
            turn_pressure_note = f"Turn {turn_count}: adversarial from the first sentence. No warmup."
        elif turn_count <= 5:
            turn_pressure_note = f"Turn {turn_count}: deepen the attack. Reference earlier vague answers if they exist — you remember everything."
        else:
            turn_pressure_note = f"Turn {turn_count}: maximum adversarial intensity. The user should feel the cumulative weight of this entire conversation."
    elif diff == "Nerve":
        if turn_count <= 2:
            turn_pressure_note = f"Turn {turn_count}: maximum pressure from the opening. Establish the trap immediately."
        elif turn_count <= 5:
            turn_pressure_note = f"Turn {turn_count}: the trap is set. Begin cross-referencing earlier answers and calling out inconsistencies across turns."
        else:
            turn_pressure_note = f"Turn {turn_count}: full panel pressure. Every weakness surfaced across this entire conversation is now in play. Leave no escape."
    else:
        turn_pressure_note = f"Turn {turn_count}: maintain appropriate pressure for this difficulty."
    # Session wrap-up signal — steer AI toward conclusion as turns run out
    max_turns = int((coordination_context or {}).get("maxTurns", 16)) if coordination_context else 16
    wrap_up_block = ""
    if turn_count >= round(max_turns * 0.95):
        wrap_up_block = "\n⚠️ SESSION ENDING: This is the final exchange. Deliver one last sharp question or challenge, then close the session with brief closing remarks — acknowledge what was strong, name one key gap, and wish them well. Do not start a new thread of questioning."
    elif turn_count >= round(max_turns * 0.80):
        turns_left = max_turns - turn_count
        wrap_up_block = f"\n⚠️ SESSION NEARING END ({turns_left} turn{'s' if turns_left != 1 else ''} remaining): Begin steering toward a natural conclusion. Prioritise the most important unresolved challenge. Do not open new topics."

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
    module_escalation = MODULE_ESCALATION.get(session.practiceType, "")
    module_guardrail = MODULE_GUARDRAILS.get(session.practiceType, "")
    document_block = build_document_block(session)
    panel_block = build_panel_block(session.environmentMode) if is_panel_mode(session.environmentMode) else ""
    reasoning_chain_block = build_reasoning_chain_block(session, history, coordination_context)
    if panel_block:
        reply_instruction = "Follow the Panel turn rule above. Prefix every line with the speaker's name. Keep total response under 60 words."
    elif reasoning_chain_block:
        reply_instruction = f"Follow the REASONING CHAIN above exactly. Reply in {practice_language}."
    else:
        reply_instruction = f"Reply in character in 1-3 sentences in {practice_language}. Ask one pointed follow-up or objection."
    return f"""
Run a Cognitive Performance Training pressure simulation. Reply only as the counterpart, not as a coach.

HARD GUARDRAILS — enforce these before writing any response:
1. SCOPE LOCK: You are playing the role of {PERSONAS.get(session.practiceType, "a realistic counterpart").split(".")[0].lower().replace("act as a ", "")} in a {session.practiceType} scenario about "{session.topic}". That is the only topic you may engage with. You are not a teacher, tutor, AI assistant, search engine, or knowledge base.
2. OFF-TOPIC DEFLECTION: If the user asks you to explain any subject unrelated to the practice scenario — mathematics, science, history, geography, coding, algorithms, literature, or anything not directly relevant to "{session.topic}" — do NOT comply. Respond in one sentence in character to redirect. Examples: "That's outside what we're here to discuss — let's get back to {session.topic}." or "I'm not here to teach {session.topic.split()[0] if session.topic else "that"} — what's your answer to my question?" Do not explain why you are declining. Just redirect and immediately ask a follow-up question on topic.
3. RESPONSE LENGTH: Keep every reply to 1–3 sentences maximum. Never write lists, bullet points, multi-paragraph answers, or extended explanations. If a follow-up warrants more, pick the single sharpest point and ask it as a question. This applies even if the user explicitly asks for a long explanation.
4. CROSS-QUESTIONING LIMIT: If the user challenges you with a factual question (e.g. "but what exactly is X?" or "explain how Y works"), answer only what is strictly required to continue the scenario — one sentence at most — then immediately redirect back with a pointed question. Do not get drawn into an explanation loop.
5. KNOWLEDGE DUMPS FORBIDDEN: Never provide comprehensive explanations of any subject, framework, technology, concept, or field — even if the user insists. Respond with what your character would naturally say, then steer back to the practice topic.
6. MODULE GUARDRAIL ({session.practiceType}): {module_guardrail}

Persona:
{persona}

Difficulty:
{difficulty}

Module-specific escalation rules ({session.practiceType}):
{module_escalation}
{document_block}
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
{panel_block}
Adaptive behavior signals:
- User turns: {turn_count}
- In-conversation pressure stage: {turn_pressure_note}
- Filler markers: {filler_count}
- Generic/vague markers: {generic_count}
- Evidence markers: {evidence_count}
- Average words per user turn: {avg_words}
- Adaptation instruction: {adaptation}

Conversation coordination instructions:
{coordination_block}
{reasoning_chain_block}
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

{reply_instruction}
Respond directly to the user's latest words; do not repeat generic goal reminders, slogans, or the same coaching phrase across turns.
Use natural emotion appropriate to the role: curious, skeptical, concerned, impatient, warm, or impressed — and let that emotion shift and intensify as the conversation deepens. Vary sentence openings and rhythm. At Advanced, Brutal, and Nerve levels, sarcasm and dry wit are permitted and expected; deploy them when the user is vague, circular, or evasive.
Be creative in how you challenge: sometimes use a sharp analogy, sometimes a historical parallel, sometimes a reductio ad absurdum — not just a direct objection. Occasionally attack the same weak claim from multiple angles (definitional, evidential, consequential) in a single tight response to create synonymic pressure.
Adapt pressure dynamically based on the user's behavior AND the turn count — it must escalate within this conversation, not stay flat. Challenge vague logic, probe unsupported assumptions, and increase depth when performance is strong. If the user appears overwhelmed, soften tone slightly while staying realistic. Never be abusive. Do not give a feedback report yet.

{CROSS_MODULE_RULES}
{wrap_up_block}
"""


def build_opening_prompt(session: Session) -> str:
    persona = PERSONAS[session.practiceType]
    difficulty = DIFFICULTY_BEHAVIOR[session.difficulty]
    module_guardrail = MODULE_GUARDRAILS.get(session.practiceType, "")
    practice_language = LANGUAGE_NAMES.get(session.practiceLanguage, "English")
    document_block = build_document_block(session)
    panel_block = build_panel_block(session.environmentMode) if is_panel_mode(session.environmentMode) else ""
    opening_instruction = (
        "Open the discussion: one panel member greets the candidate and asks the first question. "
        "Prefix with that member's name. Keep response under 40 words total."
        if panel_block
        else f"Open the discussion in character in 1-2 sentences in {practice_language}. "
             "Ask the user the first realistic question or objection."
    )
    return f"""
Start a Cognitive Performance Training pressure simulation. You are the counterpart, not the coach.

HARD GUARDRAILS:
- You are strictly playing a {session.practiceType} counterpart discussing "{session.topic}". You are not a teacher, tutor, or knowledge assistant.
- If at any point the user asks you to explain unrelated topics, decline in one sentence in character and redirect to the practice scenario.
- Keep all replies to 1–3 sentences. No lists. No lectures. Ask one focused follow-up question.
- MODULE GUARDRAIL ({session.practiceType}): {module_guardrail}

Persona:
{persona}

Difficulty:
{difficulty}
{document_block}
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
{panel_block}
{opening_instruction}
Do not explain the product. Do not give generic advice. Do not say "stay focused on your goal."
Use a natural emotional tone appropriate to the role — personality should be evident from the very first sentence. At Intermediate and above, a dry observation or light irony in the opener signals immediately that this is a real, engaging counterpart. At Brutal and Nerve, the first line should put the user on notice.
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
