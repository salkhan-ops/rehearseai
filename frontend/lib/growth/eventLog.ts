"use client";

// Best-effort funnel event log — lets the admin Growth Dashboard show real signup,
// CTA, interview, and checkout counts instead of only mock/preview data. Writes are
// fire-and-forget: a failure here must never block or surface an error to the user,
// since this is instrumentation, not a product feature.

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";

// Only a curated subset of events are worth persisting server-side (admin visibility
// into the core conversion funnel) — everything else stays GA4/Meta-only so this
// collection doesn't fill up with noise.
const LOGGED_EVENT_NAMES = new Set([
  "landing_page_viewed",
  "hero_cta_clicked",
  "signup_started",
  "signup_completed",
  "login_completed",
  "interview_room_entered",
  "interview_started",
  "interview_completed",
  "feedback_viewed",
  "checkout_initiated",
  "purchase_completed",
]);

function sanitizeParams(params: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params).slice(0, 12)) {
    if (typeof value === "string") out[key] = value.slice(0, 200);
    else if (typeof value === "number" || typeof value === "boolean") out[key] = value;
  }
  return out;
}

export function logAnalyticsEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || !LOGGED_EVENT_NAMES.has(name)) return;
  const db = getFirebaseDb();
  if (!db) return;
  const uid = getFirebaseAuth()?.currentUser?.uid || null;
  addDoc(collection(db, "analyticsEvents"), {
    name,
    uid,
    params: sanitizeParams(params),
    path: window.location.pathname,
    createdAt: serverTimestamp(),
  }).catch(() => undefined);
}
