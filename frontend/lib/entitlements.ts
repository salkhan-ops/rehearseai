"use client";

import { doc, getDoc, increment, setDoc, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { defaultPlans, type Entitlements } from "./admin";

export type UsageInfo = {
  used: number;
  limit: number | "unlimited";
  remaining: number | "unlimited";
  resetDate: string;
  planName: string;
};

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function nextResetLabel() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export async function getSessionUsage(uid: string, entitlements: Entitlements, planName = "Free"): Promise<UsageInfo> {
  const limit = entitlements.maxSessionsPerMonth;
  const resetDate = nextResetLabel();
  if (limit === "unlimited") return { used: 0, limit: "unlimited", remaining: "unlimited", resetDate, planName };
  const db = getFirebaseDb();
  if (!db || !uid || uid === "guest") return { used: 0, limit, remaining: limit, resetDate, planName };
  const snap = await getDoc(doc(db, "userSessionCounters", uid));
  const used: number = snap.exists() ? (snap.data()[currentMonthKey()] || 0) : 0;
  const remaining = Math.max(0, (limit as number) - used);
  return { used, limit, remaining, resetDate, planName };
}

function currentDayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export async function getDailyDocUsage(uid: string, entitlements: import("./admin").Entitlements): Promise<{ used: number; limit: number | "unlimited"; remaining: number | "unlimited" }> {
  const limit = entitlements.docGroundingDocsPerDay ?? 1;
  if (limit === "unlimited") return { used: 0, limit: "unlimited", remaining: "unlimited" };
  const db = getFirebaseDb();
  if (!db || !uid || uid === "guest") return { used: 0, limit, remaining: limit };
  const snap = await getDoc(doc(db, "userDocCounters", uid));
  const used: number = snap.exists() ? (snap.data()[currentDayKey()] || 0) : 0;
  const remaining = Math.max(0, (limit as number) - used);
  return { used, limit, remaining };
}

export async function incrementDailyDocCount(uid: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !uid || uid === "guest") return;
  const ref = doc(db, "userDocCounters", uid);
  const snap = await getDoc(ref);
  const day = currentDayKey();
  if (snap.exists()) {
    await updateDoc(ref, { [day]: increment(1) });
  } else {
    await setDoc(ref, { [day]: 1 });
  }
}

export async function incrementMonthlySessionCount(uid: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !uid || uid === "guest") return;
  const ref = doc(db, "userSessionCounters", uid);
  const snap = await getDoc(ref);
  const month = currentMonthKey();
  if (snap.exists()) {
    await updateDoc(ref, { [month]: increment(1) });
  } else {
    await setDoc(ref, { [month]: 1 });
  }
}

export async function getUserEntitlements(uid: string): Promise<Entitlements> {
  const db = getFirebaseDb();
  if (process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "false") return defaultPlans[0].entitlements;
  if (!db || !uid || uid === "guest") return defaultPlans[0].entitlements;
  const userEntitlements = await getDoc(doc(db, "userEntitlements", uid));
  if (userEntitlements.exists()) return userEntitlements.data().entitlements as Entitlements;
  const user = await getDoc(doc(db, "users", uid));
  const planId = user.exists() ? String(user.data().planId || "free") : "free";
  return (defaultPlans.find((plan) => plan.planId === planId) || defaultPlans[0]).entitlements;
}

export async function getUserPlanInfo(uid: string): Promise<{ entitlements: Entitlements; planName: string; planId: string }> {
  const db = getFirebaseDb();
  const freePlan = defaultPlans.find((p) => p.planId === "free") || defaultPlans[0];
  if (process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "false") {
    return { entitlements: freePlan.entitlements, planName: freePlan.name, planId: "free" };
  }
  if (!db || !uid || uid === "guest") {
    return { entitlements: freePlan.entitlements, planName: freePlan.name, planId: "free" };
  }
  const snap = await getDoc(doc(db, "userEntitlements", uid));
  if (snap.exists()) {
    return {
      entitlements: snap.data().entitlements as Entitlements,
      planName: snap.data().planName ?? "Free",
      planId: snap.data().planId ?? "free",
    };
  }
  const user = await getDoc(doc(db, "users", uid));
  const planId = user.exists() ? String(user.data().planId || "free") : "free";
  const plan = defaultPlans.find((p) => p.planId === planId) || freePlan;
  return { entitlements: plan.entitlements, planName: plan.name, planId };
}

export function canUsePracticeType(entitlements: Entitlements, practiceType: string) {
  const map: Record<string, keyof Entitlements> = {
    "Job Interview": "allowInterviewMode",
    "Presentation / Public Speaking": "allowPresentationMode",
    "Thesis Defense": "allowPresentationMode",
    "Salary Negotiation": "allowSalaryNegotiationMode",
    "Difficult Conversation": "allowDifficultConversationMode",
    "Teaching Session": "allowTeachingMode",
    "Sales Pitch": "allowSalesPitchMode",
    "Panel Discussion": "allowChallengeMode",
  };
  const key = map[practiceType];
  return key ? Boolean(entitlements[key]) : true;
}
