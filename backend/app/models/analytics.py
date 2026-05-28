from typing import Any
from pydantic import BaseModel, Field


class MetricScores(BaseModel):
    confidence: int = Field(ge=0, le=100)
    clarity: int = Field(ge=0, le=100)
    logicalConsistency: int = Field(ge=0, le=100)
    persuasiveness: int = Field(ge=0, le=100)
    emotionalComposure: int = Field(ge=0, le=100)
    responseStructure: int = Field(ge=0, le=100)
    brevityEfficiency: int = Field(ge=0, le=100)
    criticalThinking: int = Field(ge=0, le=100)
    adaptability: int = Field(ge=0, le=100)
    listeningAccuracy: int = Field(ge=0, le=100)
    directness: int = Field(ge=0, le=100)
    handlingInterruptions: int = Field(ge=0, le=100)
    recoveryAfterPressure: int = Field(ge=0, le=100)
    intellectualDepth: int = Field(ge=0, le=100)
    reasoningQuality: int = Field(ge=0, le=100)


class ReasoningTree(BaseModel):
    id: str
    sessionId: str
    question: str
    rootNode: str
    branches: list[dict[str, Any]]
    outcomes: list[dict[str, Any]]
    createdAt: str


class PerformanceAnalytics(BaseModel):
    id: str
    sessionId: str
    userId: str
    metrics: MetricScores
    confidenceMetrics: dict[str, Any] = Field(default_factory=dict)
    pressureMetrics: dict[str, Any] = Field(default_factory=dict)
    reasoningMetrics: dict[str, Any] = Field(default_factory=dict)
    communicationMetrics: dict[str, Any] = Field(default_factory=dict)
    benchmarkMetrics: dict[str, Any] = Field(default_factory=dict)
    adaptivePersona: dict[str, Any] = Field(default_factory=dict)
    resilienceData: list[dict[str, Any]] = Field(default_factory=list)
    challengeResult: dict[str, Any] = Field(default_factory=dict)
    progression: dict[str, Any] = Field(default_factory=dict)
    shareHighlights: dict[str, Any] = Field(default_factory=dict)
    criticalMoments: list[dict[str, Any]] = Field(default_factory=list)
    radarData: list[dict[str, Any]]
    timelineData: list[dict[str, Any]]
    pressureData: list[dict[str, Any]]
    heatmapData: list[dict[str, Any]]
    efficiencyData: list[dict[str, Any]]
    trendData: list[dict[str, Any]]
    reasoningSummary: str
    reasoningStrengths: list[str]
    reasoningGaps: list[str]
    missingEvidence: list[str]
    strongerStructures: list[str]
    coachingSuggestions: list[str]
    replayItems: list[dict[str, Any]]
    decisionTrees: list[ReasoningTree]
    historicalInsights: list[str]
    milestones: list[str]
    createdAt: str
