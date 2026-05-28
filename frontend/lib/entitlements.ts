"use client";

import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { defaultPlans, type Entitlements } from "./admin";

export async function getUserEntitlements(uid: string): Promise<Entitlements> {
  const db = getFirebaseDb();
  if (!db || !uid || uid === "guest") return defaultPlans[0].entitlements;
  const userEntitlements = await getDoc(doc(db, "userEntitlements", uid));
  if (userEntitlements.exists()) return userEntitlements.data().entitlements as Entitlements;
  const user = await getDoc(doc(db, "users", uid));
  const planId = user.exists() ? String(user.data().planId || "free") : "free";
  return (defaultPlans.find((plan) => plan.planId === planId) || defaultPlans[0]).entitlements;
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
