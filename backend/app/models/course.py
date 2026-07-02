from typing import Literal, Optional
from pydantic import BaseModel, Field

from app.models.session import Difficulty, PracticeType


CourseSkillLevel = Literal["beginner", "intermediate", "advanced"]
CalendarView = Literal["monthly", "weekly", "daily"]
CourseStatus = Literal["active", "completed", "paused", "archived"]
CourseSessionStatus = Literal["scheduled", "completed", "missed", "skipped", "rescheduled"]
ReminderTiming = Literal[0, 15, 30, 60]


class CourseGenerateRequest(BaseModel):
    userId: str = "guest"
    goal: str = Field(default="Think clearly under pressure", min_length=3, max_length=240)
    skillLevel: CourseSkillLevel = "intermediate"
    targetRole: Optional[str] = Field(default=None, max_length=120)
    availableHoursPerWeek: float = Field(default=3, ge=1, le=20)
    preferredSessionDuration: int = Field(default=20, ge=5, le=120)
    targetCompletionDate: Optional[str] = None
    practiceCategories: list[PracticeType] = Field(default_factory=lambda: ["Job Interview", "Difficult Conversation"])
    difficulty: Difficulty = "Intermediate"
    practiceLanguage: str = Field(default="en", max_length=8)
    feedbackLanguage: str = Field(default="en", max_length=8)


class CourseTemplate(BaseModel):
    id: str
    title: str
    category: str
    durationDays: int
    frequency: str
    difficulty: Difficulty
    dailyMinutes: str
    targetSkills: list[str]
    description: str
    whoFor: str
    expectedTransformation: str
    isActive: bool = True
    sortOrder: int = 0


class CourseTemplateEnrollmentRequest(BaseModel):
    userId: str = "guest"
    templateId: str
    packageId: Optional[str] = None
    preferredStartDate: str
    preferredDays: list[int] = Field(default_factory=lambda: [1, 2, 3, 4, 5])
    preferredTime: str = Field(default="20:00", pattern=r"^\d{2}:\d{2}$")
    timezone: str = Field(default="UTC", max_length=80)
    reminderMinutesBefore: int = Field(default=15, ge=0, le=1440)
    difficulty: Difficulty = "Intermediate"
    practiceLanguage: str = Field(default="en", max_length=8)
    feedbackLanguage: str = Field(default="en", max_length=8)


class Course(BaseModel):
    id: str
    userId: str
    templateId: Optional[str] = None
    title: str
    goal: str
    status: CourseStatus = "active"
    durationDays: int
    difficulty: Difficulty
    targetSkills: list[str]
    weeklyHours: float
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    preferredDays: list[int] = Field(default_factory=list)
    preferredTime: str = "20:00"
    timezone: str = "UTC"
    reminderMinutesBefore: int = 15
    progressPercent: int = 0
    milestones: list[dict] = Field(default_factory=list)
    practiceLanguage: str = "en"
    feedbackLanguage: str = "en"
    createdAt: str
    updatedAt: str


class CourseModule(BaseModel):
    id: str
    courseId: str
    title: str
    objective: str
    order: int
    createdAt: str


class CourseSession(BaseModel):
    id: str
    courseId: str
    userId: str
    scheduledDate: str
    scheduledTime: str = "20:00"
    timezone: str = "UTC"
    completed: bool = False
    practiceType: PracticeType
    reasoningFocus: str
    pressureLevel: int = Field(default=50, ge=0, le=100)
    durationMinutes: int = Field(default=20, ge=5, le=120)
    generatedScenario: dict
    status: CourseSessionStatus = "scheduled"
    createdAt: str
    completedAt: Optional[str] = None
    sessionId: Optional[str] = None


class CourseProgress(BaseModel):
    id: str
    userId: str
    courseId: str
    completedSessions: int = 0
    totalSessions: int = 0
    streak: int = 0
    growthMetrics: dict = Field(default_factory=dict)
    lastCompletedAt: Optional[str] = None
    updatedAt: str


class Notification(BaseModel):
    id: str
    userId: str
    type: str
    title: str
    message: str
    read: bool = False
    actionUrl: Optional[str] = None
    createdAt: str


class UserProgress(BaseModel):
    uid: str
    xp: int = 0
    level: int = 1
    levelName: str = "Initiate"
    streak: int = 0
    longestStreak: int = 0
    completedCourses: int = 0
    completedSessions: int = 0
    achievements: list[str] = Field(default_factory=list)
    updatedAt: str


class Achievement(BaseModel):
    id: str
    userId: str
    achievementKey: str
    title: str
    description: str
    category: str
    unlockedAt: str


class CourseBundle(BaseModel):
    course: Course
    modules: list[CourseModule]
    sessions: list[CourseSession]
    progress: CourseProgress


class CourseStartResponse(BaseModel):
    sessionId: str
    courseSessionId: str
