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

export type SessionPayload = {
  userId: string;
  practiceType: PracticeType;
  difficulty: Difficulty;
  topic: string;
  context: string;
  goal: string;
  optionalNotes?: string;
};
