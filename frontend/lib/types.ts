export const practiceTypes = [
  "Job Interview",
  "Presentation / Public Speaking",
  "Panel Discussion",
  "Thesis Defense",
  "Salary Negotiation",
  "Difficult Conversation",
  "Teaching Session",
  "Sales Pitch",
  "Casual Chat",
  "Podcast / Interview Show",
] as const;

export const difficulties = ["Beginner", "Intermediate", "Advanced", "Brutal", "Nerve"] as const;
export const nerveEntryTypes = ["Topic", "Presentation", "Thesis", "Startup Pitch", "Report / Proposal"] as const;
export const nervePersonas = ["Investor", "Professor", "Executive", "Board Member", "Regulator", "Consultant", "Client", "Mixed Panel"] as const;
export const environmentModes = [
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
] as const;

export type PracticeType = (typeof practiceTypes)[number];
export type Difficulty = (typeof difficulties)[number] | "Friendly" | "Realistic";
export type NerveEntryType = (typeof nerveEntryTypes)[number];
export type NervePersona = (typeof nervePersonas)[number];
export type EnvironmentMode = (typeof environmentModes)[number];
export type ConversationMode = "manual" | "natural";
export type SilenceCategory = "micro_pause" | "yielding_pause" | "abandoned_pause";
export type RealtimeConversationEngineState = "LISTENING" | "PROCESSING" | "AI_SPEAKING" | "WAITING" | "PROMPTING";

export type ConversationState = {
  audio: {
    volume_rms: number;
    silence_category: SilenceCategory;
    filler_rate: number;
    voice_onset_delay_ms: number;
    pitch_rising: boolean;
    volume_rising: boolean;
    sampled_at: number;
  };
  vision: {
    gaze_on_camera: number;
    brow_raised: number;
    brow_furrowed: number;
    mouth_aperture: number;
    head_nodding: boolean;
    speech_readiness: number;
    engagement_score: number;
    confusion_score: number;
    sampled_at: number;
  };
  transcript: {
    final: string;
    interim: string;
    is_final: boolean;
    speech_final: boolean;
  };
  timing: {
    silence_ms: number;
    speech_duration_ms: number;
  };
  turn_complete_probability: number;
  engine_state: RealtimeConversationEngineState;
  sampled_at: number;
};

export type SessionHint = {
  hintId: string;
  userId: string;
  sessionId: string;
  timestamp: string;
  hintText: string;
  hintType: "reasoning" | "evidence" | "conciseness" | "stakeholder" | "confidence" | "structure";
  triggerReason: string;
  urgency: "low" | "medium" | "high";
  confidence: number;
  wasViewed: boolean;
  wasExpanded: boolean;
  createdAt: string;
};

export type HintSummary = {
  hintsReceived: number;
  hintsViewed: number;
  hintsExpanded: number;
  hintsFollowedRate: number;
  reasoningImprovement: string;
  coachingDependency: "low" | "watch" | "high" | string;
  highUrgencyHints: number;
};

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
  environmentMode?: EnvironmentMode;
  preferredConversationMode?: ConversationMode;
  nerveEntryType?: NerveEntryType;
  nervePersona?: NervePersona;
  nerveMaterialName?: string;
  nerveMaterialText?: string;
  nerveAnalysisId?: string;
  pressureLevel?: number;
  status: "active" | "completed" | "abandoned";
  turnCount: number;
  createdAt: string;
  lastActivityAt?: string;
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
  conversationDynamicsReport?: {
    summary?: string;
    whereUserStruggled?: string[];
    pressureTriggers?: string[];
    stanceChanges?: number;
    howUserHandledOpposition?: string;
    howUserHandledAgreementFollowUp?: string;
    responseBreakdownMoments?: string[];
    recoveryMoments?: string[];
    aiActionsUsed?: string[];
  } | null;
  nerveReport?: {
    defendabilityScore?: number;
    metrics?: Record<string, number>;
    strongestDefense?: string;
    weakestDefense?: string;
    questionsThatBrokeYou?: string[];
    assumptionsYouCouldNotDefend?: string[];
    recommendedFollowUpPractice?: string;
  } | null;
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

export type DocumentMode = "neutral" | "harsh_critical" | "socratic" | "supportive" | "profile";

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
  environmentMode?: EnvironmentMode;
  preferredConversationMode?: ConversationMode;
  nerveEntryType?: NerveEntryType;
  nervePersona?: NervePersona;
  nerveMaterialName?: string;
  nerveMaterialText?: string;
  documentText?: string;
  documentName?: string;
  documentMode?: DocumentMode;
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

export type IntakeAnswers = {
  situation?: string;
  eventDate?: string;
  weakSpots?: string[];
  confidenceLevel?: number;
  practiceFrequency?: number;
};

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
  intakeAnswers?: IntakeAnswers;
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
  intakeAnswers?: IntakeAnswers;
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
  sampleCount?: number;
  averageWordsPerMinute: number;
  averagePauseMs: number;
  longPauseThresholdMs: number;
  shortPauseThresholdMs?: number;
  fillerWordRate: number;
  hesitationMarkerRate?: number;
  averageSilenceAfterMs?: number;
  averageSpeechDurationMs?: number;
  averageTurnWordCount?: number;
  averageVisualThinkingPauseMs?: number;
  preferredConversationMode?: ConversationMode;
  averageAutoSubmitSilenceMs?: number;
  averageThinkingPauseMs?: number;
  autoSubmitCorrections?: number;
  typicalMouthActivityBeforeContinue?: number;
  typicalGazeShiftDuringThinking?: number;
  confusionMarkerRate?: number;
  defensivenessMarkerRate?: number;
  rushingWordsPerMinuteThreshold?: number;
  thinkingPauseMs?: number;
  overexplainingWordCountThreshold?: number;
  hesitationMarkers: string[];
  preferredAiWaitMs: number;
  confidenceBaseline?: number | null;
  lastPracticeType?: string;
  lastLanguage?: string;
  createdAt: string;
  updatedAt: string;
};

export type CoordinationUserState = "calm" | "thinking" | "confused" | "rushing" | "hesitating" | "defensive" | "overexplaining" | "collapsing" | "improving";
export type ConversationStance = "supportive" | "curious" | "neutral" | "skeptical" | "opposing" | "hostile";
export type ResponseBreakdown = "none" | "mild" | "moderate" | "severe";
export type LikelyCause = "thinking" | "confused" | "avoiding" | "overexplaining" | "emotionally pressured" | "lacks evidence";

export type ConversationControl = {
  mode: string;
  stance: ConversationStance;
  pressureLevel: number;
  responseBreakdown: ResponseBreakdown;
  likelyCause: LikelyCause;
  shouldClarify: boolean;
  shouldChallenge: boolean;
  shouldInterrupt: boolean;
  shouldSupport: boolean;
  shouldEscalate: boolean;
  activePanelPersona?: string | null;
  aiAction: "support" | "clarify" | "challenge" | "interrupt" | "escalate" | "multi_panel_followup";
  breakdownSignals: string[];
};

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
  responseBreakdown: ResponseBreakdown;
  likelyCause: LikelyCause;
  stance: ConversationStance;
  pressureLevel: number;
  aiAction: ConversationControl["aiAction"];
  conversationControl: ConversationControl;
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
  conversationState?: ConversationState;
  sessionId?: string;
  userId: string;
  coordinationContext?: {
    pauseDecision?: string;
    userStateApprox?: string;
    adjustedWaitMs?: number;
    cameraAssisted?: boolean;
    cameraHesitation?: boolean;
  };
  conversationMode?: ConversationMode;
  turnTiming?: {
    silenceMs?: number;
    speechDurationMs?: number;
    autoSubmitted?: boolean;
    cameraAssisted?: boolean;
    pauseDecision?: string;
    interruptionDetected?: boolean;
    gentlePromptShown?: boolean;
    forceResolutionTriggered?: boolean;
    hardTimeoutTriggered?: boolean;
  };
  speechEmotion?: {
    label?: string;
    confidenceScore?: number;
    pace?: string;
    signals?: {
      pitchVariancePct?: number;
      pitchMeanHz?: number;
      energyTrend?: number;
      wpm?: number;
      fillerRatio?: number;
      fillerCount?: number;
    };
  };
};

export type TurnEmotionRecord = {
  label: string;
  confidenceScore: number;
  pace: string;
  signals: {
    pitchVariancePct: number;
    pitchMeanHz: number;
    energyTrend: number;
    wpm: number;
    fillerRatio: number;
    fillerCount: number;
  };
};

export type TurnCoachingRecord = {
  betterAnswer: string;
  structureTip: string;
  emotionalGuidance: string;
  missedOpportunity: string;
  toneAdvice: string;
};

export type TurnRecord = {
  turnIndex: number;
  aiSpeaker: string;
  aiQuestion: string;
  userText: string;
  speechDurationMs: number;
  silenceBeforeMs: number;
  emotion: TurnEmotionRecord;
  coaching?: TurnCoachingRecord;
};

export type AnalysisSummary = {
  avgConfidenceScore: number;
  dominantEmotion: string;
  strongestTurn: number;
  weakestTurn: number;
  topStrengths: string[];
  topImprovements: string[];
};

export type SessionAnalysis = {
  analysisId: string;
  sessionId: string;
  generatedAt: string;
  practiceType: string;
  difficulty: string;
  turns: TurnRecord[];
  summary: AnalysisSummary;
  status: "generating" | "complete" | "failed" | "not_found";
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
