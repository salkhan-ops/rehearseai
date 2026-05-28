from typing import Literal
from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    userId: str = Field(default="guest")
    content: str = Field(min_length=1, max_length=4000)


class Message(BaseModel):
    id: str
    role: Literal["user", "ai"]
    content: str
    createdAt: str
