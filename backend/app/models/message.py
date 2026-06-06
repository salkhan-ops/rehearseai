from typing import Literal, Optional
from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    userId: str = Field(default="guest")
    content: str = Field(min_length=1, max_length=4000)
    interimTranscript: str = ""
    speechDurationMs: int = 0
    silenceMs: int = 0
    wordTimings: Optional[list[dict]] = None
    coordinationContext: Optional[dict] = None
    conversationMode: Optional[Literal["manual", "natural"]] = None
    turnTiming: Optional[dict] = None


class Message(BaseModel):
    id: str
    role: Literal["user", "ai"]
    content: str
    createdAt: str
    metadata: Optional[dict] = None
