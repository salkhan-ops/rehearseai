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
  practiceLanguage?: string;
  feedbackLanguage?: string;
  durationPreference?: number;
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
  practiceLanguage?: string;
  feedbackLanguage?: string;
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
  practiceLanguage?: string;
  feedbackLanguage?: string;
  durationPreference?: number;
};

export type PracticeSchedule = {
  id: string;
  userId: string;
  frequencyType: "daily" | "twice_weekly" | "three_times_weekly" | "weekdays" | "custom";
  daysOfWeek: number[];
  preferredTime: string;
  timezone: string;
  enabled: boolean;
  categories: PracticeType[];
  durationPreference: number;
  reminderMinutesBefore: number;
  createdAt: string;
  updatedAt: string;
  nextReminderAt?: string;
};

export type PracticeHistory = {
  id: string;
  userId: string;
  sessionId?: string;
  scheduleId?: string;
  completed: boolean;
  skipped: boolean;
  completedAt?: string;
  streakDay: number;
  createdAt: string;
};

export type PracticeScenario = {
  category: PracticeType;
  difficulty: Difficulty;
  title: string;
  topic: string;
  setting: string;
  emotionalContext: string;
  pressureSituation: string;
  objective: string;
  personalityDynamics: string;
  optionalNotes: string;
};

export type DailyChallenge = {
  title: string;
  objective: string;
  scenario: PracticeScenario;
};

export type CourseSkillLevel = "beginner" | "intermediate" | "advanced";

export type CourseGeneratePayload = {
  userId: string;
  goal: string;
  skillLevel: CourseSkillLevel;
  targetRole?: string;
  availableHoursPerWeek: number;
  preferredSessionDuration: number;
  targetCompletionDate?: string;
  practiceCategories: PracticeType[];
  difficulty: Difficulty;
  practiceLanguage?: string;
  feedbackLanguage?: string;
};

export type Course = {
  id: string;
  userId: string;
  templateId?: string | null;
  title: string;
  goal: string;
  status?: "active" | "completed" | "paused" | "archived";
  durationDays: number;
  difficulty: Difficulty;
  targetSkills: string[];
  weeklyHours: number;
  startDate?: string | null;
  endDate?: string | null;
  preferredDays?: number[];
  preferredTime?: string;
  timezone?: string;
  reminderMinutesBefore?: number;
  progressPercent?: number;
  milestones?: Array<{ day: number; title: string; completed: boolean }>;
  practiceLanguage?: string;
  feedbackLanguage?: string;
  createdAt: string;
  updatedAt: string;
};

export type CourseModule = {
  id: string;
  courseId: string;
  title: string;
  objective: string;
  order: number;
  createdAt: string;
};

export type CourseSession = {
  id: string;
  courseId: string;
  userId: string;
  scheduledDate: string;
  scheduledTime?: string;
  timezone?: string;
  completed: boolean;
  practiceType: PracticeType;
  reasoningFocus: string;
  pressureLevel: number;
  durationMinutes: number;
  generatedScenario: PracticeScenario;
  status?: "scheduled" | "completed" | "missed" | "skipped" | "rescheduled";
  createdAt: string;
  completedAt?: string | null;
  sessionId?: string | null;
};

export type CourseProgress = {
  id: string;
  userId: string;
  courseId: string;
  completedSessions: number;
  totalSessions: number;
  streak: number;
  growthMetrics: Record<string, number | string>;
  lastCompletedAt?: string | null;
  updatedAt: string;
};

export type CourseBundle = {
  course: Course;
  modules: CourseModule[];
  sessions: CourseSession[];
  progress: CourseProgress;
};

export type CourseTemplate = {
  id: string;
  title: string;
  category: string;
  durationDays: number;
  frequency: string;
  difficulty: Difficulty;
  dailyMinutes: string;
  targetSkills: string[];
  description: string;
  whoFor: string;
  expectedTransformation: string;
  isActive: boolean;
  sortOrder: number;
};

export type CourseTemplateEnrollmentPayload = {
  userId: string;
  templateId: string;
  preferredStartDate: string;
  preferredDays: number[];
  preferredTime: string;
  timezone: string;
  reminderMinutesBefore: number;
  difficulty: Difficulty;
  practiceLanguage?: string;
  feedbackLanguage?: string;
};

export type NotificationItem = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string | null;
  createdAt: string;
};

export type UserProgress = {
  uid: string;
  xp: number;
  level: number;
  levelName: string;
  streak: number;
  longestStreak: number;
  completedCourses: number;
  completedSessions: number;
  achievements: string[];
  updatedAt: string;
  nextLevelXp?: number;
};

export type Achievement = {
  id: string;
  userId: string;
  achievementKey: string;
  title: string;
  description: string;
  category: string;
  unlockedAt: string;
};

export type VoiceProfile = {
  userId: string;
  averageWordsPerMinute: number;
  averagePauseMs: number;
  longPauseThresholdMs: number;
  fillerWordRate: number;
  hesitationMarkers: string[];
  preferredAiWaitMs: number;
  confidenceBaseline?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CoordinationUserState = "calm" | "thinking" | "confused" | "rushing" | "hesitating" | "defensive" | "overexplaining" | "collapsing" | "improving";

export type ConversationCoordinationState = {
  userState: CoordinationUserState;
  silenceMs: number;
  speechDurationMs: number;
  wordsPerMinute: number;
  fillerCount: number;
  shouldAiWait: boolean;
  shouldAiRespond: boolean;
  shouldAiInterrupt: boolean;
  recommendedAiTone: string;
  recommendedResponseLength: "micro" | "short" | "medium";
  pressureAdjustment: "decrease" | "maintain" | "increase";
  coachingSignal: string;
  cartesia: {
    voiceEmotion: string;
    speakingRate: number;
    intensity: number;
    pauseStyle: string;
  };
};

export type ConversationAnalyzePayload = {
  transcript?: string;
  interimTranscript?: string;
  speechDurationMs?: number;
  silenceMs?: number;
  wordTimings?: Array<{ word: string; startMs?: number; endMs?: number }>;
  sessionId?: string;
  userId: string;
};

export type CalibrationStart = {
  calibrationId: string;
  userId: string;
  paragraph: string;
  startedAt: string;
};

export type SubscriptionStatus = "active" | "trialing" | "cancelled" | "past_due";

export type CurrentSubscription = {
  subscriptionId: string;
  uid: string;
  paddleSubscriptionId?: string;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string | null;
  planId: string;
  planName?: string;
  plan?: { id: string; name: string; price: string; features: string[] };
  billingProvider: "paddle";
  portalConfigured: boolean;
  createdAt?: string;
  updatedAt?: string;
};
