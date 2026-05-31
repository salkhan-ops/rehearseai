from typing import Literal, Optional
from pydantic import BaseModel, Field

from app.models.session import Difficulty, PracticeType


FrequencyType = Literal["daily", "twice_weekly", "three_times_weekly", "weekdays", "custom"]


class PracticeScheduleCreate(BaseModel):
    userId: str = Field(default="guest")
    frequencyType: FrequencyType = "daily"
    daysOfWeek: list[int] = Field(default_factory=list)
    preferredTime: str = Field(default="20:00", pattern=r"^\d{2}:\d{2}$")
    timezone: str = Field(default="UTC", max_length=80)
    enabled: bool = True
    categories: list[PracticeType] = Field(default_factory=lambda: ["Job Interview"])
    durationPreference: int = Field(default=10, ge=5, le=60)
    reminderMinutesBefore: int = Field(default=15, ge=0, le=1440)


class PracticeSchedule(PracticeScheduleCreate):
    id: str
    createdAt: str
    updatedAt: str


class PracticeHistoryCreate(BaseModel):
    userId: str = "guest"
    sessionId: Optional[str] = None
    scheduleId: Optional[str] = None
    completed: bool = False
    skipped: bool = False
    streakDay: int = 0


class PracticeHistory(PracticeHistoryCreate):
    id: str
    completedAt: Optional[str] = None
    createdAt: str


class ScenarioRequest(BaseModel):
    userId: str = "guest"
    category: PracticeType = "Job Interview"
    difficulty: Difficulty = "Intermediate"
    practiceLanguage: str = Field(default="en", max_length=8)
    feedbackLanguage: str = Field(default="en", max_length=8)
    targetRole: Optional[str] = Field(default=None, max_length=120)
    experienceLevel: Optional[str] = Field(default=None, max_length=80)


class PracticeScenario(BaseModel):
    category: PracticeType
    difficulty: Difficulty
    title: str
    topic: str
    setting: str
    emotionalContext: str
    pressureSituation: str
    objective: str
    personalityDynamics: str
    optionalNotes: str


class QuickStartRequest(ScenarioRequest):
    durationPreference: int = Field(default=10, ge=5, le=60)
