from typing import Optional
from pydantic import BaseModel


class EmotionSignals(BaseModel):
    pitchVariancePct: float = 0
    pitchMeanHz: float = 0
    energyTrend: float = 0
    wpm: int = 0
    fillerRatio: float = 0
    fillerCount: int = 0


class TurnEmotion(BaseModel):
    label: str = "unclear"          # confident | nervous | hesitant | monotone | rushed | unclear
    confidenceScore: float = 0.5    # 0–1
    pace: str = "normal"            # slow | normal | fast
    signals: EmotionSignals = EmotionSignals()


class TurnCoaching(BaseModel):
    betterAnswer: str = ""
    structureTip: str = ""
    emotionalGuidance: str = ""
    missedOpportunity: str = ""
    toneAdvice: str = ""


class TurnRecord(BaseModel):
    turnIndex: int
    aiSpeaker: str = ""
    aiQuestion: str
    userText: str
    speechDurationMs: int = 0
    silenceBeforeMs: int = 0
    emotion: TurnEmotion = TurnEmotion()
    coaching: Optional[TurnCoaching] = None


class AnalysisSummary(BaseModel):
    avgConfidenceScore: int = 0         # 0–100
    dominantEmotion: str = "unclear"
    strongestTurn: int = 0
    weakestTurn: int = 0
    topStrengths: list[str] = []
    topImprovements: list[str] = []


class SessionAnalysis(BaseModel):
    analysisId: str
    sessionId: str
    generatedAt: str
    practiceType: str = ""
    difficulty: str = ""
    turns: list[TurnRecord] = []
    summary: AnalysisSummary = AnalysisSummary()
    status: str = "complete"            # generating | complete | failed
