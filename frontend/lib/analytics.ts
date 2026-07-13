"use client";

// Thin wrapper around gtag so every call site is one line and
// the GA_ID never leaks — callers just call trackEvent().
// Safe to call on the server (no-ops if window is absent).

import { trackCustom as trackMetaCustom } from "@/lib/metaPixel";
import { logAnalyticsEvent } from "@/lib/growth/eventLog";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// gtag's own external library loads asynchronously (next/script strategy="afterInteractive"),
// but window.gtag isn't defined until that load finishes -- so an event fired at mount time
// (landing_page_viewed, in particular) can race the script load and lose, silently dropping
// the event with no error. Queue-and-flush, mirroring the existing pendingEvents pattern in
// lib/metaPixel.ts, so nothing fired before gtag is ready gets lost.
const pendingGaEvents: Array<{ name: string; params: Record<string, string | number | boolean> }> = [];

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;
  if (!window.gtag) {
    pendingGaEvents.push({ name, params: params ?? {} });
    return;
  }
  window.gtag("event", name, params ?? {});
}

export function flushAnalyticsQueue(): void {
  if (typeof window === "undefined" || !window.gtag) return;
  pendingGaEvents.splice(0).forEach(({ name, params }) => window.gtag!("event", name, params));
}

// ── Shared funnel context ───────────────────────────────────────────────
// A handful of parameters (session id, first-touch UTM, user status) belong on
// nearly every funnel event. Rather than threading them through every call site,
// they're tracked here once and merged in automatically by trackFunnelEvent().

export type UserStatus = "anonymous" | "new_user" | "returning_user";

// Exported so the inline gtag bootstrap script (components/analytics/GoogleAnalytics.tsx)
// can read/write the same sessionStorage keys in plain JS, ahead of React hydration --
// see LANDING_VIEWED_KEY below for why that matters.
export const SESSION_ID_KEY = "rehearseai_session_id";
export const UTM_KEY = "rehearseai_utm";
const USER_STATUS_KEY = "rehearseai_user_status";
export const LANDING_VIEWED_KEY = "rehearseai_landing_viewed_ga";

let cachedUserStatus: UserStatus = "anonymous";

function safeSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function getSessionId(): string {
  const storage = safeSessionStorage();
  if (!storage) return "";
  let id = storage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = (typeof crypto !== "undefined" && "randomUUID" in crypto)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    storage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

// First-touch attribution: only the first UTM params seen this session are kept,
// so a later internal link click (with no UTM params) doesn't erase the ad click
// that actually brought the visitor in.
export function captureUtmParams(search: string): void {
  const storage = safeSessionStorage();
  if (!storage || storage.getItem(UTM_KEY)) return;
  const params = new URLSearchParams(search);
  const utm: Record<string, string> = {};
  (["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const).forEach((key) => {
    const value = params.get(key);
    if (value) utm[key] = value;
  });
  if (Object.keys(utm).length > 0) storage.setItem(UTM_KEY, JSON.stringify(utm));
}

function getUtmParams(): Record<string, string> {
  const storage = safeSessionStorage();
  if (!storage) return {};
  try {
    return JSON.parse(storage.getItem(UTM_KEY) || "{}");
  } catch {
    return {};
  }
}

export function setUserStatus(status: UserStatus): void {
  cachedUserStatus = status;
  safeSessionStorage()?.setItem(USER_STATUS_KEY, status);
}

function getUserStatus(): UserStatus {
  const storage = safeSessionStorage();
  const stored = storage?.getItem(USER_STATUS_KEY) as UserStatus | null;
  return stored || cachedUserStatus;
}

// Coarse, best-effort signal for filtering obvious non-human/junk traffic out of funnel
// reports without dropping the underlying event data. Not a security control -- a bot that
// wants to look human can trivially spoof webdriver/UA. Good enough to explain "0s
// engagement, 0.07 events/user" style sessions when reviewing paid-traffic quality.
function isLikelyBot(): boolean {
  if (typeof navigator === "undefined") return false;
  if (navigator.webdriver) return true;
  const ua = navigator.userAgent || "";
  return /bot|crawl|spider|headless|puppeteer|playwright|phantomjs/i.test(ua);
}

// Fires an event to GA4, Meta Pixel (as a custom event), and — best-effort — a
// lightweight Firestore log so the admin panel can show real (not mock) funnel
// counts. Automatically attaches session id, first-touch UTM fields, and user
// status so call sites don't have to.
export function trackFunnelEvent(
  name: string,
  params: Record<string, string | number | boolean> = {},
  opts: { skipGa?: boolean } = {},
): void {
  const base = {
    session_id: getSessionId(),
    user_status: getUserStatus(),
    is_likely_bot: isLikelyBot(),
    ...getUtmParams(),
  };
  const merged = { ...base, ...params };
  if (!opts.skipGa) trackEvent(name, merged);
  trackMetaCustom(name, merged);
  logAnalyticsEvent(name, merged);
}

// Dedup helper: fires the given callback at most once per browser tab per key
// (survives re-renders and route changes, but not a full reload — refreshing a
// page and firing its "viewed" event again is expected, not a duplicate).
const firedOnce = new Set<string>();
export function once(key: string, fn: () => void): void {
  if (firedOnce.has(key)) return;
  firedOnce.add(key);
  fn();
}

// Typed helper for the specific events we care about most —
// keeps call sites readable and makes typos compile-time errors.

export const track = {
  // Landing / acquisition
  //
  // The GA4 leg of this event is normally already fired by the inline gtag bootstrap
  // script (components/analytics/GoogleAnalytics.tsx) as soon as the GA script itself
  // loads -- independent of React hydration finishing. That matters because this page's
  // hero renders a heavy animated tree, and on slow/low-power mobile connections (e.g.
  // in-app browsers from paid social) hydration can take seconds or never complete before
  // the user bounces. Gating this event purely behind a React useEffect (the old
  // behavior) meant those sessions were invisible here even though GA's own automatic
  // pageview still counted them -- producing a landed-vs-instrumented gap that looked
  // like a traffic-quality problem but was partly a measurement bug. Skip the GA leg here
  // if the inline script already sent it, to avoid double counting; still forward to Meta
  // Pixel + the Firestore event log either way since those only exist on this code path.
  landingPageViewed: (params?: { sourcePage?: string }) => {
    const alreadySentToGa =
      typeof window !== "undefined" && safeSessionStorage()?.getItem(LANDING_VIEWED_KEY) === "1";
    trackFunnelEvent(
      "landing_page_viewed",
      { source_page: params?.sourcePage ?? "" },
      { skipGa: alreadySentToGa },
    );
  },
  heroCtaClicked: (label: string) => trackFunnelEvent("hero_cta_clicked", { label }),
  ctaClicked: (label: string) => trackEvent("cta_clicked", { label }),
  ctaImpression: (label: string) => trackFunnelEvent("cta_impression", { label }),
  scrollDepth: (percent: 25 | 50 | 75 | 100) => trackFunnelEvent("scroll_depth", { percent }),
  timeOnPage: (seconds: number) => trackFunnelEvent("time_on_page", { seconds }),
  guestTrialStarted: (scenario: string) => trackFunnelEvent("guest_trial_started", { scenario }),

  // Auth — distinct events so a new account and a repeat login are never conflated.
  signupStarted: (method: "email" | "google") => trackFunnelEvent("signup_started", { method }),
  signupCompleted: (method: "email" | "google") => trackFunnelEvent("signup_completed", { method }),
  loginCompleted: (method: "email" | "google" = "email") => trackFunnelEvent("login_completed", { method }),
  ageConfirmed: () => trackEvent("age_confirmed"),

  // Interview funnel
  interviewRoomEntered: (scenario: string) => trackFunnelEvent("interview_room_entered", { scenario }),
  interviewStarted: (scenario: string, difficulty: string) =>
    trackFunnelEvent("interview_started", { scenario, difficulty }),
  firstAiQuestionShown: (scenario: string) => trackFunnelEvent("first_ai_question_shown", { scenario }),
  firstUserResponseSubmitted: (scenario: string) => trackFunnelEvent("first_user_response_submitted", { scenario }),
  interviewCompleted: (scenario: string, turnCount: number) =>
    trackFunnelEvent("interview_completed", { scenario, turnCount }),
  feedbackViewed: (scenario?: string) => trackFunnelEvent("feedback_viewed", { scenario: scenario ?? "" }),

  // Legacy aliases — kept so existing call sites and the mock pixel dashboard
  // labels stay valid; new instrumentation should prefer the funnel names above.
  sessionStarted: (practiceType: string, difficulty: string) =>
    trackEvent("session_started", { practiceType, difficulty }),
  sessionCompleted: (practiceType: string, turnCount: number) =>
    trackEvent("session_completed", { practiceType, turnCount }),

  // Monetization
  upgradeClicked: (planName: string, location: string) =>
    trackEvent("upgrade_clicked", { planName, location }),
  checkoutInitiated: (priceId: string, label: string) => trackFunnelEvent("checkout_initiated", { priceId, label }),
  checkoutCompleted: (priceId: string) => trackEvent("checkout_completed", { priceId }),
  purchaseCompleted: (priceId: string, value?: number) =>
    trackFunnelEvent("purchase_completed", { priceId, ...(value !== undefined ? { value } : {}) }),
  reportViewed: () => trackEvent("report_viewed"),
  pdfDownloaded: () => trackEvent("pdf_downloaded"),
};
