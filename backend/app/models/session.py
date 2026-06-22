from typing import Literal, Optional
from pydantic import BaseModel, Field

DocumentMode = Literal["neutral", "harsh_critical", "socratic", "supportive"]

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

Difficulty = Literal["Beginner", "Intermediate", "Advanced", "Brutal", "Nerve", "Friendly", "Realistic"]
NerveEntryType = Literal["Topic", "Presentation", "Thesis", "Startup Pitch", "Report / Proposal"]
NervePersona = Literal["Investor", "Professor", "Executive", "Board Member", "Regulator", "Consultant", "Client", "Mixed Panel"]
EnvironmentMode = Literal[
    "AI Orb",
    "Single Interviewer",
    "Executive Interview",
    "Thesis Defense Panel",
    "Investor Panel",
    "Board Meeting",
    "Classroom Presentation",
    "Hostile Panel",
    "Conference Q&A",
    "Custom Future Mode",
]
ConversationMode = Literal["manual", "natural"]


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
    environmentMode: EnvironmentMode = "AI Orb"
    preferredConversationMode: ConversationMode = "natural"
    nerveEntryType: Optional[NerveEntryType] = None
    nervePersona: Optional[NervePersona] = None
    nerveMaterialName: Optional[str] = Field(default=None, max_length=180)
    nerveMaterialText: Optional[str] = Field(default=None, max_length=8000)
    documentText: Optional[str] = Field(default=None, max_length=15000)
    documentName: Optional[str] = Field(default=None, max_length=180)
    documentMode: Optional[DocumentMode] = None


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
    environmentMode: EnvironmentMode = "AI Orb"
    preferredConversationMode: ConversationMode = "natural"
    nerveEntryType: Optional[NerveEntryType] = None
    nervePersona: Optional[NervePersona] = None
    nerveMaterialName: Optional[str] = None
    nerveMaterialText: Optional[str] = None
    nerveAnalysisId: Optional[str] = None
    documentText: Optional[str] = None
    documentName: Optional[str] = None
    documentMode: Optional[DocumentMode] = None
    pressureLevel: int = Field(default=1, ge=1, le=10)
    status: Literal["active", "completed", "abandoned"] = "active"
    turnCount: int = 0
    createdAt: str
    lastActivityAt: Optional[str] = None
    completedAt: Optional[str] = None
