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
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  paddleProductId: string;
  paddleMonthlyPriceId: string;
  paddleYearlyPriceId: string;
  isActive: boolean;
  sortOrder: number;
  entitlements: Entitlements;
  createdAt?: unknown;
  updatedAt?: unknown;
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
  const db = dbOrThrow();
  await updateDoc(doc(db, "users", uid), { role: admin ? "admin" : "user", updatedAt: serverTimestamp() });
}

export async function assignPlan(uid: string, plan: Plan, status: string, overrides: Partial<Entitlements> = {}, trialEndsAt = "") {
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
  const [plans, users] = await Promise.all([getPlans(), getUsers()]);
  return {
    totalPlans: plans.length,
    activeUsers: users.filter((user) => user.status !== "disabled").length,
    activeSubscribers: users.filter((user) => user.planId && user.planId !== "free").length,
    pendingSubscriptions: 0,
  };
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
