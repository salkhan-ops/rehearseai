"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
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
    description: "3 sessions/month, basic feedback, limited history.",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "USD",
    paddleProductId: "",
    paddleMonthlyPriceId: "",
    paddleYearlyPriceId: "",
    isActive: true,
    isPublic: true,
    sortOrder: 1,
    entitlements: baseEntitlements,
  },
  {
    planId: "pro",
    name: "Pro",
    description: "Unlimited sessions, advanced reports, brutal mode, history, shareable reports, decision trees, and challenge mode.",
    priceMonthly: 19,
    priceYearly: 190,
    currency: "USD",
    paddleProductId: "",
    paddleMonthlyPriceId: "",
    paddleYearlyPriceId: "",
    isActive: true,
    isPublic: true,
    sortOrder: 2,
    entitlements: {
      ...baseEntitlements,
      maxSessionsPerMonth: "unlimited",
      maxMessagesPerSession: 40,
      maxSessionMinutes: 45,
      allowBrutalMode: true,
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
      monthlyGeminiTokenLimit: 400000,
    },
  },
  {
    planId: "coach",
    name: "Coach",
    description: "Everything in Pro plus advanced personas, benchmarking, priority features, extended history, and advanced replay intelligence.",
    priceMonthly: 49,
    priceYearly: 490,
    currency: "USD",
    paddleProductId: "",
    paddleMonthlyPriceId: "",
    paddleYearlyPriceId: "",
    isActive: true,
    isPublic: true,
    sortOrder: 3,
    entitlements: {
      ...baseEntitlements,
      maxSessionsPerMonth: "unlimited",
      maxMessagesPerSession: 80,
      maxSessionMinutes: 90,
      allowBrutalMode: true,
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
