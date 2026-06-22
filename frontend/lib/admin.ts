"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

export type Entitlements = {
  maxSessionsPerMonth: number | "unlimited";
  maxMessagesPerSession: number;
  maxSessionMinutes: number;
  allowBrutalMode: boolean;
  allowNerveMode: boolean;
  allowChallengeMode: boolean;
  allowVoiceMode: boolean;
  allowAdvancedAnalytics: boolean;
  allowDecisionTree: boolean;
  allowHistoricalTrends: boolean;
  allowBenchmarking: boolean;
  allowShareableReports: boolean;
  allowReportExport: boolean;
  allowSessionReplay: boolean;
  allowLongitudinalMemory: boolean;
  allowCustomPersonas: boolean;
  allowCourseTemplates: boolean;
  allowScheduledPractice: boolean;
  allowBeginnerHints: boolean;
  allowConversationMap: boolean;
  allowLanguageSelection: boolean;
  allowTeachingMode: boolean;
  allowInterviewMode: boolean;
  allowPresentationMode: boolean;
  allowSalaryNegotiationMode: boolean;
  allowDifficultConversationMode: boolean;
  allowSalesPitchMode: boolean;
  reportDepth: "basic" | "advanced" | "coach";
  historyRetentionDays: number | "unlimited";
  monthlyGeminiTokenLimit: number;
  docGroundingDocsPerDay: number | "unlimited";
};

export type Plan = {
  planId: string;
  slug?: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  paddleProductId: string;
  paddleMonthlyPriceId: string;
  paddleYearlyPriceId: string;
  isActive: boolean;
  isPublic?: boolean;
  isFeatured?: boolean;
  signal?: string;
  features?: string[];
  sortOrder: number;
  entitlements: Entitlements;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type Product = {
  productId: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  linkedPlanId: string;
  linkedTemplateId?: string;
  priceDisplay: string;
  badgeText: string;
  isFeatured: boolean;
  isPublic: boolean;
  isActive?: boolean;
  sortOrder: number;
  heroText: string;
  benefits: string[];
  limitations: string[];
  ctaText: string;
  ctaUrl: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CoursePackage = {
  packageId: string;
  title: string;
  description: string;
  practiceType: string;
  stakeLevel: "high" | "medium" | "low";
  durationDays: number;
  sessionsIncluded: number;
  price: number;
  currency: string;
  paddlePriceId: string;
  isActive: boolean;
  sortOrder: number;
};

export const defaultCoursePackages: CoursePackage[] = [
  // ── Job Interview ─────────────────────────────────────────────────────────
  {
    packageId: "interview-7",
    title: "Job Interview Sprint",
    description: "Daily simulations with a demanding hiring manager. Build STAR answers, handle behavioural traps, and walk in composed. One session per day — 45 minutes of focused pressure.",
    practiceType: "Job Interview",
    stakeLevel: "high",
    durationDays: 7,
    sessionsIncluded: 7,
    price: 29,
    currency: "USD",
    paddlePriceId: "",
    isActive: true,
    sortOrder: 10,
  },
  {
    packageId: "interview-14",
    title: "Interview Mastery",
    description: "Two weeks of escalating interviews — warm-up questions week one, exec-level panel stress in week two. Covers behavioural, competency, and technical framing. Leave no question unanswered.",
    practiceType: "Job Interview",
    stakeLevel: "high",
    durationDays: 14,
    sessionsIncluded: 14,
    price: 59,
    currency: "USD",
    paddlePriceId: "",
    isActive: true,
    sortOrder: 11,
  },

  // ── Salary Negotiation ────────────────────────────────────────────────────
  {
    packageId: "negotiation-7",
    title: "Salary Negotiation Sprint",
    description: "Seven sessions covering anchoring, countering low-ball offers, and holding silence under pressure. Enter any offer or promotion conversation knowing exactly what to say and when to stop.",
    practiceType: "Salary Negotiation",
    stakeLevel: "high",
    durationDays: 7,
    sessionsIncluded: 7,
    price: 29,
    currency: "USD",
    paddlePriceId: "",
    isActive: true,
    sortOrder: 20,
  },
  {
    packageId: "negotiation-21",
    title: "Negotiation Mastery",
    description: "Three weeks of systematic negotiation training — anchoring, BATNA framing, concession strategy, and closing under pushback. Covers salary, contract terms, vendor deals, and internal influence.",
    practiceType: "Salary Negotiation",
    stakeLevel: "high",
    durationDays: 21,
    sessionsIncluded: 21,
    price: 89,
    currency: "USD",
    paddlePriceId: "",
    isActive: true,
    sortOrder: 21,
  },

  // ── Presentation / Public Speaking ────────────────────────────────────────
  {
    packageId: "speaking-7",
    title: "Public Speaking Boost",
    description: "Hook, structure, Q&A. Seven sessions with a skeptical audience to build composure and clarity. Covers opening strong, holding attention, and fielding tough questions without losing your thread.",
    practiceType: "Presentation / Public Speaking",
    stakeLevel: "medium",
    durationDays: 7,
    sessionsIncluded: 7,
    price: 29,
    currency: "USD",
    paddlePriceId: "",
    isActive: true,
    sortOrder: 30,
  },
  {
    packageId: "speaking-14",
    title: "Presentation Mastery",
    description: "Fourteen days of increasingly hostile audiences. Week one: structure and delivery. Week two: hostile Q&A, executive boardroom pressure, and landing under time constraints. For anyone with a high-stakes presentation on the horizon.",
    practiceType: "Presentation / Public Speaking",
    stakeLevel: "medium",
    durationDays: 14,
    sessionsIncluded: 14,
    price: 59,
    currency: "USD",
    paddlePriceId: "",
    isActive: true,
    sortOrder: 31,
  },

  // ── Sales Pitch ───────────────────────────────────────────────────────────
  {
    packageId: "sales-7",
    title: "Sales Pitch Sprint",
    description: "Handle ROI objections, budget pushback, timing resistance, and competitive questions without caving. Close naturally. Seven daily sessions simulating a tough buyer who has heard it all before.",
    practiceType: "Sales Pitch",
    stakeLevel: "high",
    durationDays: 7,
    sessionsIncluded: 7,
    price: 29,
    currency: "USD",
    paddlePriceId: "",
    isActive: true,
    sortOrder: 40,
  },
  {
    packageId: "sales-14",
    title: "Sales Mastery",
    description: "From first call to close in two weeks. Covers discovery, demo delivery, objection handling, multi-stakeholder navigation, and negotiating final terms. Simulates the full sales cycle under pressure.",
    practiceType: "Sales Pitch",
    stakeLevel: "high",
    durationDays: 14,
    sessionsIncluded: 14,
    price: 59,
    currency: "USD",
    paddlePriceId: "",
    isActive: true,
    sortOrder: 41,
  },

  // ── Difficult Conversation ─────────────────────────────────────────────────
  {
    packageId: "difficult-7",
    title: "Difficult Conversations",
    description: "Seven sessions covering the conversations most people avoid — performance feedback, conflict resolution, setting limits, and saying no without burning bridges. Each session simulates a different emotionally charged dynamic.",
    practiceType: "Difficult Conversation",
    stakeLevel: "high",
    durationDays: 7,
    sessionsIncluded: 7,
    price: 29,
    currency: "USD",
    paddlePriceId: "",
    isActive: true,
    sortOrder: 50,
  },
  {
    packageId: "difficult-14",
    title: "Conflict & Communication Mastery",
    description: "Two weeks of high-stakes interpersonal scenarios — layoffs, underperformance conversations, relationship repair, and professional limit-setting. Builds the language and composure to handle what most leaders avoid.",
    practiceType: "Difficult Conversation",
    stakeLevel: "high",
    durationDays: 14,
    sessionsIncluded: 14,
    price: 59,
    currency: "USD",
    paddlePriceId: "",
    isActive: true,
    sortOrder: 51,
  },

  // ── Panel Discussion ───────────────────────────────────────────────────────
  {
    packageId: "panel-7",
    title: "Panel Defense",
    description: "Seven sessions simulating a multi-person panel — interviewers, investors, or examiners — each with a different angle of attack. Builds the ability to stay coherent, pivot gracefully, and hold your position under cross-examination.",
    practiceType: "Panel Discussion",
    stakeLevel: "high",
    durationDays: 7,
    sessionsIncluded: 7,
    price: 29,
    currency: "USD",
    paddlePriceId: "",
    isActive: true,
    sortOrder: 60,
  },

  // ── Thesis Defense ─────────────────────────────────────────────────────────
  {
    packageId: "thesis-7",
    title: "Thesis Defense Sprint",
    description: "Seven sessions with a rigorous academic examiner challenging your methodology, findings, and conclusions. Covers viva structure, literature critiques, and handling 'what would you do differently.' For anyone defending in under two weeks.",
    practiceType: "Thesis Defense",
    stakeLevel: "high",
    durationDays: 7,
    sessionsIncluded: 7,
    price: 29,
    currency: "USD",
    paddlePriceId: "",
    isActive: true,
    sortOrder: 70,
  },
  {
    packageId: "thesis-14",
    title: "Thesis Defense Mastery",
    description: "Two weeks of structured viva preparation. Week one: defending methodology and literature. Week two: handling hostile examiner pressure, bridging gaps in evidence, and closing with confidence. For PhD, MRes, and professional doctorates.",
    practiceType: "Thesis Defense",
    stakeLevel: "high",
    durationDays: 14,
    sessionsIncluded: 14,
    price: 59,
    currency: "USD",
    paddlePriceId: "",
    isActive: true,
    sortOrder: 71,
  },

  // ── Teaching Session ────────────────────────────────────────────────────────
  {
    packageId: "teaching-7",
    title: "Teaching Confidence",
    description: "Seven sessions simulating a class or workshop audience — disengaged students, challenging questions, and off-topic tangents. Builds structure, pacing, and the ability to hold a room without losing momentum.",
    practiceType: "Teaching Session",
    stakeLevel: "medium",
    durationDays: 7,
    sessionsIncluded: 7,
    price: 29,
    currency: "USD",
    paddlePriceId: "",
    isActive: true,
    sortOrder: 80,
  },

  // ── Casual Chat ─────────────────────────────────────────────────────────────
  {
    packageId: "casual-7",
    title: "Casual Chat Confidence",
    description: "Seven low-pressure daily conversations to build natural fluency, comfort with small talk, and the habit of expressing yourself freely without overthinking. Ideal after a period of isolation or when English isn't your first language.",
    practiceType: "Casual Chat",
    stakeLevel: "low",
    durationDays: 7,
    sessionsIncluded: 7,
    price: 29,
    currency: "USD",
    paddlePriceId: "",
    isActive: true,
    sortOrder: 90,
  },
  {
    packageId: "casual-14",
    title: "Fluency Builder",
    description: "Two weeks of progressively deeper conversations — everyday topics, opinions, storytelling, and debate. Designed to build genuine conversational fluency and reduce the mental effort of speaking spontaneously.",
    practiceType: "Casual Chat",
    stakeLevel: "low",
    durationDays: 14,
    sessionsIncluded: 14,
    price: 59,
    currency: "USD",
    paddlePriceId: "",
    isActive: true,
    sortOrder: 91,
  },
];

export type PracticeTemplate = {
  templateId: string;
  title: string;
  slug: string;
  category: string;
  practiceType: string;
  difficulty: string;
  description: string;
  scenarioPrompt: string;
  beginnerBriefingEnabled: boolean;
  conversationMapEnabled: boolean;
  hintsEnabled: boolean;
  defaultDurationMinutes: number;
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
  requiredEntitlements: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type CourseTemplateAdmin = {
  templateId: string;
  title: string;
  slug: string;
  category: string;
  durationDays: number;
  durationLabel: string;
  frequency: string;
  dailyMinutes: number;
  difficulty: string;
  targetSkills: string[];
  description: string;
  expectedTransformation: string;
  schedulePattern: string;
  milestones: string[];
  requiredEntitlements: string[];
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminLog = {
  logId: string;
  adminUid: string;
  adminEmail?: string;
  action: string;
  targetType: string;
  targetId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  createdAt: string;
};

export type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  activePlans: number;
  activeProducts: number;
  activeCourseTemplates: number;
  activePracticeTemplates: number;
  pendingBillingEvents: number;
  adminActionsThisWeek: number;
  totalPlans?: number;
  activeSubscribers?: number;
  pendingSubscriptions?: number;
};

export type AdminUser = {
  uid: string;
  email?: string;
  displayName?: string;
  role?: "user" | "admin";
  planName?: string;
  planId?: string;
  status?: string;
  createdAt?: unknown;
  lastLoginAt?: unknown;
};

export type ContactMessageStatus = "new" | "in_review" | "resolved";

export type ContactMessage = {
  id: string;
  messageId: string;
  name: string;
  email: string;
  userId?: string;
  category: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt: string;
};

export type TelemetrySample = {
  telemetryId: string;
  anonymousUserId: string;
  sessionId: string;
  turnId: string;
  practiceType: string;
  difficulty: string;
  language: string;
  wordsPerMinute: number;
  wordCount: number;
  fillerWordRate: number;
  detectedUserState: string;
  detectedPauseType: string;
  detectedConfusion: boolean;
  detectedOverexplaining: boolean;
  detectedDefensiveness: boolean;
  detectedRushing: boolean;
  createdAt: string;
};

export type TelemetryLabelPayload = {
  telemetryId: string;
  labeledBy: string;
  labels: {
    pauseType: string;
    userState: string;
    aiActionQuality: string;
  };
  notes: string;
};

export type SafetyEvent = {
  eventId: string;
  userId: string;
  sessionId: string;
  practiceType?: string;
  difficulty?: string;
  domain: string;
  riskLevel: string;
  safetyAction: string;
  allowResponse: boolean;
  redirectMessage?: string;
  reasons: string[];
  messageExcerpt: string;
  createdAt: string;
};

export type SafetyStats = {
  total: number;
  crisis: number;
  scopeViolations: number;
  dependencyIndicators: number;
  blocked: number;
};

const baseEntitlements: Entitlements = {
  maxSessionsPerMonth: 3,
  maxMessagesPerSession: 16,
  maxSessionMinutes: 15,
  allowBrutalMode: false,
  allowNerveMode: false,
  allowChallengeMode: false,
  allowVoiceMode: true,
  allowAdvancedAnalytics: false,
  allowDecisionTree: false,
  allowHistoricalTrends: false,
  allowBenchmarking: false,
  allowShareableReports: false,
  allowReportExport: false,
  allowSessionReplay: true,
  allowLongitudinalMemory: false,
  allowCustomPersonas: false,
  allowCourseTemplates: false,
  allowScheduledPractice: true,
  allowBeginnerHints: true,
  allowConversationMap: true,
  allowLanguageSelection: true,
  allowTeachingMode: true,
  allowInterviewMode: true,
  allowPresentationMode: true,
  allowSalaryNegotiationMode: true,
  allowDifficultConversationMode: true,
  allowSalesPitchMode: true,
  reportDepth: "basic",
  historyRetentionDays: 30,
  monthlyGeminiTokenLimit: 50000,
  docGroundingDocsPerDay: 1,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Admin request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export const defaultPlans: Plan[] = [
  {
    planId: "free",
    name: "Free",
    description: "5 sessions/month. Beginner and Intermediate modes. Voice + text. Basic reports.",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "USD",
    paddleProductId: "",
    paddleMonthlyPriceId: "",
    paddleYearlyPriceId: "",
    isActive: true,
    isPublic: true,
    isFeatured: false,
    signal: "Get started",
    features: [
      "5 sessions per month",
      "Beginner & Intermediate modes",
      "Voice + text rehearsal",
      "Basic performance reports",
      "Coaching hints & conversation map",
    ],
    sortOrder: 1,
    entitlements: { ...baseEntitlements, maxSessionsPerMonth: 5 },
  },
  {
    planId: "pro",
    name: "Pro",
    description: "20 sessions/month. All modes up to Advanced. Course templates. Advanced analytics and reports.",
    priceMonthly: 19,
    priceYearly: 149,
    currency: "USD",
    paddleProductId: "",
    paddleMonthlyPriceId: "",
    paddleYearlyPriceId: "",
    isActive: true,
    isPublic: true,
    isFeatured: true,
    signal: "Most popular",
    features: [
      "20 sessions per month",
      "All modes up to Advanced",
      "Voice + text rehearsal",
      "Advanced performance reports",
      "Course templates access",
      "Coaching hints & conversation map",
      "Practice routines & reminders",
    ],
    sortOrder: 2,
    entitlements: {
      ...baseEntitlements,
      maxSessionsPerMonth: 20,
      maxMessagesPerSession: 40,
      maxSessionMinutes: 45,
      allowBrutalMode: false,
      allowNerveMode: false,
      allowChallengeMode: true,
      allowAdvancedAnalytics: true,
      allowDecisionTree: true,
      allowHistoricalTrends: true,
      allowShareableReports: true,
      allowReportExport: true,
      allowLongitudinalMemory: true,
      allowCourseTemplates: true,
      reportDepth: "advanced",
      historyRetentionDays: 365,
      monthlyGeminiTokenLimit: 300000,
      docGroundingDocsPerDay: 3,
    },
  },
  {
    planId: "coach",
    name: "Coach",
    description: "45 sessions/month. Brutal & Nerve pressure modes. Advanced personas, deep analytics, shareable reports.",
    priceMonthly: 29,
    priceYearly: 229,
    currency: "USD",
    paddleProductId: "",
    paddleMonthlyPriceId: "",
    paddleYearlyPriceId: "",
    isActive: true,
    isPublic: true,
    isFeatured: false,
    signal: "Maximum pressure",
    features: [
      "45 sessions per month",
      "Everything in Pro",
      "Brutal & Nerve pressure modes",
      "Advanced AI personas",
      "Deep analytics & benchmarking",
      "Shareable report cards",
      "Priority support",
    ],
    sortOrder: 3,
    entitlements: {
      ...baseEntitlements,
      maxSessionsPerMonth: 45,
      maxMessagesPerSession: 80,
      maxSessionMinutes: 90,
      allowBrutalMode: true,
      allowNerveMode: true,
      allowChallengeMode: true,
      allowAdvancedAnalytics: true,
      allowDecisionTree: true,
      allowHistoricalTrends: true,
      allowBenchmarking: true,
      allowShareableReports: true,
      allowReportExport: true,
      allowLongitudinalMemory: true,
      allowCustomPersonas: true,
      allowCourseTemplates: true,
      reportDepth: "coach",
      historyRetentionDays: "unlimited",
      monthlyGeminiTokenLimit: 1200000,
      docGroundingDocsPerDay: "unlimited",
    },
  },
];

function dbOrThrow() {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase is not configured.");
  return db;
}

export async function seedDefaultPlans() {
  const db = dbOrThrow();
  await Promise.all(defaultPlans.map((plan) => setDoc(doc(db, "plans", plan.planId), { ...plan, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true })));
}

export async function getPlans() {
  const db = dbOrThrow();
  const snapshot = await getDocs(collection(db, "plans"));
  const plans = snapshot.docs.map((item) => item.data() as Plan).sort((a, b) => a.sortOrder - b.sortOrder);
  return plans.length ? plans : defaultPlans;
}

export async function getPublicPlans(): Promise<Plan[]> {
  try {
    const db = getFirebaseDb();
    if (!db) return defaultPlans.filter((p) => p.isPublic && p.isActive);
    const snapshot = await getDocs(query(collection(db, "plans"), where("isPublic", "==", true), where("isActive", "==", true)));
    const plans = snapshot.docs.map((d) => d.data() as Plan).sort((a, b) => a.sortOrder - b.sortOrder);
    return plans.length ? plans : defaultPlans.filter((p) => p.isPublic && p.isActive);
  } catch {
    return defaultPlans.filter((p) => p.isPublic && p.isActive);
  }
}

export type FinanceStats = {
  estimatedMrr: number;
  estimatedArr: number;
  totalSubscribers: number;
  byPlan: { planId: string; planName: string; count: number; priceMonthly: number; revenue: number }[];
  totalUsers: number;
  freeUsers: number;
  currency: string;
};

export async function getFinanceStats(): Promise<FinanceStats> {
  const [plans, users] = await Promise.all([getPlans(), getUsers()]);
  const planMap = Object.fromEntries(plans.map((p) => [p.planId, p]));
  const byPlanMap: Record<string, { planId: string; planName: string; count: number; priceMonthly: number; revenue: number }> = {};
  for (const u of users) {
    const pid = u.planId || "free";
    const plan = planMap[pid];
    if (!byPlanMap[pid]) byPlanMap[pid] = { planId: pid, planName: plan?.name || pid, count: 0, priceMonthly: plan?.priceMonthly || 0, revenue: 0 };
    byPlanMap[pid].count++;
    byPlanMap[pid].revenue += plan?.priceMonthly || 0;
  }
  const byPlan = Object.values(byPlanMap).sort((a, b) => b.revenue - a.revenue);
  const estimatedMrr = byPlan.reduce((sum, p) => sum + p.revenue, 0);
  const freeUsers = byPlanMap["free"]?.count || 0;
  return {
    estimatedMrr,
    estimatedArr: estimatedMrr * 12,
    totalSubscribers: users.length - freeUsers,
    byPlan,
    totalUsers: users.length,
    freeUsers,
    currency: plans[0]?.currency || "GBP",
  };
}

export async function savePlan(plan: Plan) {
  const db = dbOrThrow();
  await setDoc(doc(db, "plans", plan.planId), { ...plan, updatedAt: serverTimestamp(), createdAt: plan.createdAt || serverTimestamp() }, { merge: true });
}

export async function getUsers() {
  const db = dbOrThrow();
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((item) => item.data() as AdminUser);
}

export async function findUser(term: string) {
  const db = dbOrThrow();
  const byId = await getDoc(doc(db, "users", term));
  if (byId.exists()) return byId.data() as AdminUser;
  const snapshot = await getDocs(query(collection(db, "users"), where("email", "==", term), limit(1)));
  return snapshot.docs[0]?.data() as AdminUser | undefined;
}

export async function setUserAdmin(uid: string, admin: boolean) {
  try {
    await adminRequest(`/api/admin/users/${uid}/${admin ? "make-admin" : "remove-admin"}`, { method: "POST" });
    return;
  } catch {
    // Fall back to direct Firestore in local admin setups.
  }
  const db = dbOrThrow();
  await updateDoc(doc(db, "users", uid), { role: admin ? "admin" : "user", updatedAt: serverTimestamp() });
}

export async function assignPlan(uid: string, plan: Plan, status: string, overrides: Partial<Entitlements> = {}, trialEndsAt = "") {
  try {
    await adminRequest(`/api/admin/users/${uid}/assign-plan`, {
      method: "POST",
      body: JSON.stringify({ planId: plan.planId, status, overrides, trialEndsAt, source: "admin" }),
    });
    return;
  } catch {
    // Fall back to direct Firestore in local admin setups.
  }
  const db = dbOrThrow();
  const entitlements = { ...plan.entitlements, ...overrides };
  await setDoc(doc(db, "userEntitlements", uid), {
    uid,
    planId: plan.planId,
    planName: plan.name,
    status,
    source: "admin",
    entitlements,
    overrides,
    trialEndsAt,
    subscriptionId: "",
    paddleCustomerId: "",
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await setDoc(doc(db, "users", uid), { planId: plan.planId, planName: plan.name, status, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getAdminStats() {
  try {
    return await adminRequest<AdminStats>("/api/admin/stats");
  } catch {
    const [plans, users] = await Promise.all([getPlans(), getUsers()]);
    return {
      totalUsers: users.length,
      activePlans: plans.filter((plan) => plan.isActive).length,
      activeProducts: 0,
      activeCourseTemplates: 0,
      activePracticeTemplates: 0,
      pendingBillingEvents: 0,
      adminActionsThisWeek: 0,
    totalPlans: plans.length,
    activeUsers: users.filter((user) => user.status !== "disabled").length,
    activeSubscribers: users.filter((user) => user.planId && user.planId !== "free").length,
    pendingSubscriptions: 0,
    };
  }
}

export function listProducts() {
  return adminRequest<Product[]>("/api/admin/products");
}

export function saveProduct(product: Product) {
  return adminRequest<Product>(`/api/admin/products/${product.productId}`, { method: "PATCH", body: JSON.stringify(product) });
}

export function createProduct(product: Product) {
  return adminRequest<Product>("/api/admin/products", { method: "POST", body: JSON.stringify(product) });
}

export function deleteProduct(productId: string) {
  return adminRequest(`/api/admin/products/${productId}`, { method: "DELETE" });
}

export function listPracticeTemplates() {
  return adminRequest<PracticeTemplate[]>("/api/admin/practice-templates");
}

export function savePracticeTemplate(template: PracticeTemplate) {
  return adminRequest<PracticeTemplate>(`/api/admin/practice-templates/${template.templateId}`, { method: "PATCH", body: JSON.stringify(template) });
}

export function createPracticeTemplate(template: PracticeTemplate) {
  return adminRequest<PracticeTemplate>("/api/admin/practice-templates", { method: "POST", body: JSON.stringify(template) });
}

export function deletePracticeTemplate(templateId: string) {
  return adminRequest(`/api/admin/practice-templates/${templateId}`, { method: "DELETE" });
}

export function listCourseTemplatesAdmin() {
  return adminRequest<CourseTemplateAdmin[]>("/api/admin/course-templates");
}

export function saveCourseTemplateAdmin(template: CourseTemplateAdmin) {
  return adminRequest<CourseTemplateAdmin>(`/api/admin/course-templates/${template.templateId}`, { method: "PATCH", body: JSON.stringify(template) });
}

export function createCourseTemplateAdmin(template: CourseTemplateAdmin) {
  return adminRequest<CourseTemplateAdmin>("/api/admin/course-templates", { method: "POST", body: JSON.stringify(template) });
}

export function deleteCourseTemplateAdmin(templateId: string) {
  return adminRequest(`/api/admin/course-templates/${templateId}`, { method: "DELETE" });
}

export function getAdminLogs() {
  return adminRequest<AdminLog[]>("/api/admin/logs");
}

export function getAdminBootstrapStatus() {
  return adminRequest<{ adminExists: boolean; firstAdminEmailConfigured: boolean }>("/api/admin/bootstrap/status");
}

export function claimFirstAdmin(payload: { uid: string; email: string }) {
  return adminRequest<{ uid: string; email: string; role: "admin" }>("/api/admin/bootstrap/claim", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getContactMessages(category = "", status = "") {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (status) params.set("status", status);
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/contact-messages${params.toString() ? `?${params}` : ""}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load contact messages.");
  return response.json() as Promise<ContactMessage[]>;
}

export async function updateContactMessageStatus(messageId: string, status: ContactMessageStatus) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/contact-messages/${messageId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Could not update contact message.");
  return response.json() as Promise<ContactMessage>;
}

export async function getTelemetrySamples(limit = 50) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/telemetry-samples?limit=${limit}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load telemetry samples.");
  return response.json() as Promise<TelemetrySample[]>;
}

export async function saveTelemetryLabel(payload: TelemetryLabelPayload) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/telemetry-labels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Could not save telemetry label.");
  return response.json();
}

export async function exportTrainingData(format: "jsonl" | "csv") {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/telemetry/export-training-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format }),
  });
  if (!response.ok) throw new Error("Could not export training data.");
  return response.text();
}

export async function getSafetyStats() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/safety-events/stats`, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load safety stats.");
  return response.json() as Promise<SafetyStats>;
}

export async function getSafetyEvents(category = "", riskLevel = "") {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (riskLevel) params.set("risk_level", riskLevel);
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/safety-events${params.toString() ? `?${params}` : ""}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load safety events.");
  return response.json() as Promise<SafetyEvent[]>;
}

export async function getCoursePackages(): Promise<CoursePackage[]> {
  try {
    const db = getFirebaseDb();
    if (!db) return defaultCoursePackages.filter((p) => p.isActive);
    const snap = await getDocs(query(collection(db, "coursePackages"), where("isActive", "==", true)));
    const pkgs = snap.docs.map((d) => d.data() as CoursePackage).sort((a, b) => a.sortOrder - b.sortOrder);
    return pkgs.length ? pkgs : defaultCoursePackages.filter((p) => p.isActive);
  } catch {
    return defaultCoursePackages.filter((p) => p.isActive);
  }
}

export async function saveCoursePackage(pkg: CoursePackage): Promise<void> {
  const db = dbOrThrow();
  await setDoc(doc(db, "coursePackages", pkg.packageId), { ...pkg, updatedAt: serverTimestamp(), createdAt: pkg.packageId ? serverTimestamp() : serverTimestamp() }, { merge: true });
}

export async function seedDefaultCoursePackages(): Promise<void> {
  const db = dbOrThrow();
  await Promise.all(defaultCoursePackages.map((pkg) => setDoc(doc(db, "coursePackages", pkg.packageId), { ...pkg, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true })));
}

// ── Revenue transactions ───────────────────────────────────────────────────

export type RevenueTransaction = {
  id: string;
  uid: string;
  eventType: string;
  productType: "subscription" | "course_package";
  amount: number;
  currency: string;
  planId: string;
  planName: string;
  packageId: string;
  packageTitle: string;
  paddleTransactionId: string;
  paddleSubscriptionId: string;
  paddleCustomerId: string;
  priceId: string;
  status: "paid" | "canceled" | "refunded";
  createdAt: string;
};

export async function getRevenueTransactions(limitCount = 200): Promise<RevenueTransaction[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, "revenueTransactions"), orderBy("createdAt", "desc"), limit(limitCount)));
  return snap.docs.map((d) => d.data() as RevenueTransaction);
}

// ── Churn events ───────────────────────────────────────────────────────────

export type ChurnEvent = {
  uid: string;
  planId: string;
  planName: string;
  paddleSubscriptionId: string;
  paddleCustomerId: string;
  reason: string;
  comment: string;
  effectiveAt: string;
  createdAt: string;
};

export async function getChurnEvents(limitCount = 200): Promise<ChurnEvent[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, "churnEvents"), orderBy("createdAt", "desc"), limit(limitCount)));
  return snap.docs.map((d) => d.data() as ChurnEvent);
}

// ── Webhook errors ─────────────────────────────────────────────────────────

export type WebhookError = {
  eventType: string;
  uid: string;
  error: string;
  payloadSnapshot: string;
  resolved: boolean;
  createdAt: string;
};

export async function getWebhookErrors(limitCount = 100): Promise<WebhookError[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, "webhookErrors"), orderBy("createdAt", "desc"), limit(limitCount)));
  return snap.docs.map((d) => d.data() as WebhookError);
}

export async function resolveWebhookError(errId: string): Promise<void> {
  const db = dbOrThrow();
  await updateDoc(doc(db, "webhookErrors", errId), { resolved: true });
}
