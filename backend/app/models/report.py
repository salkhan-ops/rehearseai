from typing import Optional

from pydantic import BaseModel, Field


class Report(BaseModel):
    id: str
    userId: str
    sessionId: str
    practiceLanguage: str = "en"
    feedbackLanguage: str = "en"
    confidenceScore: int = Field(ge=0, le=100)
    clarityScore: int = Field(ge=0, le=100)
    persuasivenessScore: int = Field(ge=0, le=100)
    calmnessScore: int = Field(ge=0, le=100)
    structureScore: int = Field(ge=0, le=100)
    summary: str
    strengths: list[str]
    weakMoments: list[str]
    missedOpportunities: list[str]
    improvedResponses: list[str]
    drills: list[str]
    nextRecommendation: str
    nerveReport: Optional[dict] = None
    conversationDynamicsReport: Optional[dict] = None
    createdAt: str
