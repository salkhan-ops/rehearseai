"use client";

// Reads the analyticsEvents log written by frontend/lib/growth/eventLog.ts so the admin
// Growth Dashboard can show real counts for events that have no other home in
// Firestore (CTA clicks, checkout-initiated, login vs. signup) instead of only the
// mock Pixel Events tab. Firestore rules restrict reads on this collection to admins.

import { collection, getDocs } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { daysAgo, parseIso } from "../dateUtils";

export type LiveEventDoc = { name?: string; createdAt?: { toDate?: () => Date } | string };

export type LiveEventCounts = {
  hasData: boolean;
  counts: Record<string, { today: number; last7d: number; last30d: number }>;
};

const TRACKED_NAMES = [
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
] as const;

function eventDate(doc: LiveEventDoc): Date | null {
  const raw = doc.createdAt;
  if (!raw) return null;
  if (typeof raw === "string") return parseIso(raw);
  if (typeof raw === "object" && typeof raw.toDate === "function") return raw.toDate();
  return null;
}

export class LiveEventsService {
  async getEventCounts(): Promise<LiveEventCounts> {
    const db = getFirebaseDb();
    const counts: LiveEventCounts["counts"] = Object.fromEntries(
      TRACKED_NAMES.map((name) => [name, { today: 0, last7d: 0, last30d: 0 }]),
    );
    if (!db) return { hasData: false, counts };

    const snap = await getDocs(collection(db, "analyticsEvents"));
    const today = daysAgo(0);
    const week = daysAgo(7);
    const month = daysAgo(30);
    let hasData = false;
    snap.forEach((doc) => {
      const data = doc.data() as LiveEventDoc;
      const name = data.name;
      if (!name || !(name in counts)) return;
      const at = eventDate(data);
      if (!at) return;
      hasData = true;
      if (at >= month) counts[name].last30d++;
      if (at >= week) counts[name].last7d++;
      if (at >= today) counts[name].today++;
    });
    return { hasData, counts };
  }
}
