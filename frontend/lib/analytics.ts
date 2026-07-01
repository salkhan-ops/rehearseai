"use client";

// Thin wrapper around gtag so every call site is one line and
// the GA_ID never leaks — callers just call trackEvent().
// Safe to call on the server (no-ops if window is absent).

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params ?? {});
}

// Typed helper for the specific events we care about most —
// keeps call sites readable and makes typos compile-time errors.

export const track = {
  ctaClicked:        (label: string) => trackEvent("cta_clicked", { label }),
  signupStarted:     (method: "email" | "google") => trackEvent("signup_started", { method }),
  signupCompleted:   (method: "email" | "google") => trackEvent("signup_completed", { method }),
  signinCompleted:   () => trackEvent("signin_completed"),
  ageConfirmed:      () => trackEvent("age_confirmed"),
  sessionStarted:    (practiceType: string, difficulty: string) =>
                       trackEvent("session_started", { practiceType, difficulty }),
  sessionCompleted:  (practiceType: string, turnCount: number) =>
                       trackEvent("session_completed", { practiceType, turnCount }),
  upgradeClicked:    (planName: string, location: string) =>
                       trackEvent("upgrade_clicked", { planName, location }),
  checkoutInitiated: (priceId: string, label: string) =>
                       trackEvent("checkout_initiated", { priceId, label }),
  checkoutCompleted: (priceId: string) => trackEvent("checkout_completed", { priceId }),
  reportViewed:      () => trackEvent("report_viewed"),
  pdfDownloaded:     () => trackEvent("pdf_downloaded"),
};
