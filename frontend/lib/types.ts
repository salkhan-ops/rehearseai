export const practiceTypes = [
  "Job Interview",
  "Presentation / Public Speaking",
  "Panel Discussion",
  "Thesis Defense",
  "Salary Negotiation",
  "Difficult Conversation",
  "Teaching Session",
  "Sales Pitch"
] as const;

export const difficulties = ["Friendly", "Realistic", "Brutal"] as const;

export type PracticeType = (typeof practiceTypes)[number];
export type Difficulty = (typeof difficulties)[number];

export type Session = {
  id: string;
  userId: string;
  practiceType: PracticeType;
  difficulty: Difficulty;
  topic: string;
  context: string;
  goal: string;
  optionalNotes?: string;
  status: "active" | "completed";
  turnCount: number;
  createdAt: string;
  completedAt?: string;
};

export type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  createdAt: string;
};

export type Report = {
  id: string;
  userId: string;
  sessionId: string;
  confidenceScore: number;
  clarityScore: number;
  persuasivenessScore: number;
  calmnessScore: number;
  structureScore: number;
  summary: string;
  strengths: string[];
  weakMoments: string[];
  missedOpportunities: string[];
  improvedResponses: string[];
  drills: string[];
  nextRecommendation: string;
  createdAt: string;
};

export type MetricScores = {
  confidence: number;
  clarity: number;
  logicalConsistency: number;
  persuasiveness: number;
  emotionalComposure: number;
  responseStructure: number;
  brevityEfficiency: number;
  criticalThinking: number;
  adaptability: number;
  listeningAccuracy: number;
  directness: number;
  handlingInterruptions: number;
  recoveryAfterPressure: number;
  intellectualDepth: number;
  reasoningQuality: number;
};

export type ReasoningTree = {
  id: string;
  sessionId: string;
  question: string;
  rootNode: string;
  branches: Array<{ id: string; label: string; quality: string; consequence: string }>;
  outcomes: Array<{ from: string; to: string }>;
  createdAt: string;
};

export type PerformanceAnalytics = {
  id: string;
  sessionId: string;
  userId: string;
  metrics: MetricScores;
  confidenceMetrics: Record<string, string | number | boolean | string[]>;
  pressureMetrics: Record<string, string | number | boolean | string[]>;
  reasoningMetrics: Record<string, string | number | boolean | string[]>;
  communicationMetrics: Record<string, string | number | boolean | string[]>;
  benchmarkMetrics: Record<string, string | number | boolean | string[]>;
  adaptivePersona: Record<string, unknown>;
  resilienceData: Array<Record<string, string | number>>;
  challengeResult: Record<string, string | number>;
  progression: Record<string, string | number | string[]>;
  shareHighlights: Record<string, string | number>;
  criticalMoments: Array<Record<string, string | number>>;
  radarData: Array<Record<string, string | number>>;
  timelineData: Array<Record<string, string | number>>;
  pressureData: Array<Record<string, string | number>>;
  heatmapData: Array<Record<string, string | number>>;
  efficiencyData: Array<Record<string, string | number>>;
  trendData: Array<Record<string, string | number>>;
  reasoningSummary: string;
  reasoningStrengths: string[];
  reasoningGaps: string[];
  missingEvidence: string[];
  strongerStructures: string[];
  coachingSuggestions: string[];
  replayItems: Array<Record<string, string | number>>;
  decisionTrees: ReasoningTree[];
  historicalInsights: string[];
  milestones: string[];
  createdAt: string;
};

export type SessionPayload = {
  userId: string;
  practiceType: PracticeType;
  difficulty: Difficulty;
  topic: string;
  context: string;
  goal: string;
  optionalNotes?: string;
};
