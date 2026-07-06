"use client";

// TODO: real event counts require either (a) Meta's Conversions API (server-side, so
// counts can be pulled back from Meta) or (b) logging every frontend/lib/analytics.ts
// `track.*` call to Firestore so it can be counted here. Today `track` only fires
// client-side gtag/pixel calls and nothing is persisted, so these counts are mock —
// but the event names below match the real ones already fired in lib/analytics.ts so
// labels are consistent once real logging exists.

import { buildWave } from "../mockWave";
import { PIXEL_EVENT_NAMES, type PixelEventCounts, type PixelEventName } from "../types";

const BASE_COUNTS: Record<PixelEventName, number> = {
  PageView: 42500,
  ViewContent: 18600,
  Lead: 3400,
  CompleteRegistration: 2180,
  InterviewStarted: 1640,
  VisaInterviewStarted: 90,
  SalaryNegotiationStarted: 310,
  PresentationStarted: 260,
  SessionCompleted: 980,
  FeedbackViewed: 860,
  Purchase: 214,
};

export class PixelAnalyticsService {
  async getEventCounts(): Promise<PixelEventCounts> {
    const trends = Object.fromEntries(
      PIXEL_EVENT_NAMES.map((name) => [name, buildWave(30, BASE_COUNTS[name] / 30, 0.45, `pixel-${name}`)])
    ) as Record<PixelEventName, ReturnType<typeof buildWave>>;

    return { isMock: true, counts: BASE_COUNTS, trends };
  }
}
