from typing import Literal, Optional
from pydantic import BaseModel, Field

PracticeType = Literal[
    "Job Interview",
    "Presentation / Public Speaking",
    "Panel Discussion",
    "Thesis Defense",
    "Salary Negotiation",
    "Difficult Conversation",
    "Teaching Session",
    "Sales Pitch",
]

Difficulty = Literal["Beginner", "Intermediate", "Advanced", "Brutal", "Friendly", "Realistic"]


class SessionCreate(BaseModel):
    userId: str = Field(default="guest")
    practiceType: PracticeType
    difficulty: Difficulty
    topic: str = Field(min_length=2, max_length=180)
    context: str = Field(min_length=2, max_length=1500)
    goal: str = Field(min_length=2, max_length=500)
    optionalNotes: Optional[str] = Field(default=None, max_length=1000)
    practiceLanguage: str = Field(default="en", max_length=8)
    feedbackLanguage: str = Field(default="en", max_length=8)
    durationPreference: int = Field(default=10, ge=1, le=120)


class Session(BaseModel):
    id: str
    userId: str
    practiceType: PracticeType
    difficulty: Difficulty
    topic: str
    context: str
    goal: str
    optionalNotes: Optional[str] = None
    practiceLanguage: str = "en"
    feedbackLanguage: str = "en"
    durationPreference: int = 10
    status: Literal["active", "completed"] = "active"
    turnCount: int = 0
    createdAt: str
    completedAt: Optional[str] = None
