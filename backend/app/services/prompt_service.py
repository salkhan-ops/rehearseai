from app.models.message import Message
from app.models.session import Session
from app.prompts.report_prompts import REPORT_SCHEMA
from app.prompts.roleplay_prompts import DIFFICULTY_BEHAVIOR, PERSONAS


def build_roleplay_prompt(session: Session, history: list[Message], max_history_messages: int = 8) -> str:
    turns = "\n".join([f"{message.role.upper()}: {message.content}" for message in history[-max_history_messages:]])
    persona = PERSONAS[session.practiceType]
    difficulty = DIFFICULTY_BEHAVIOR[session.difficulty]
    return f"""
Run a structured RehearseAI practice session. Reply only as the counterpart, not as a coach.

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

Conversation so far:
{turns}

Reply in character in 1-3 sentences. Ask one pointed follow-up or objection.
Never be abusive. Do not give a feedback report yet.
"""


def build_report_prompt(session: Session, history: list[Message]) -> str:
    turns = "\n".join([f"{message.role.upper()}: {message.content}" for message in history])
    return f"""
Create a structured RehearseAI feedback report for this completed practice session.

Practice type: {session.practiceType}
Difficulty: {session.difficulty}
Topic: {session.topic}
Context: {session.context}
Goal: {session.goal}

Conversation:
{turns}

{REPORT_SCHEMA}
"""
