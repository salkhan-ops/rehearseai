"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import { Check, Mail, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { trackCompleteRegistration } from "@/lib/metaPixel";
import type { LanguageCode } from "@/lib/languages";
import { NEW_SIGNUP_DESTINATION, RETURNING_USER_DESTINATION } from "@/lib/routes";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { GoogleSignInButton } from "./GoogleSignInButton";

export type AuthMode = "signin" | "signup" | "forgot";

export function AuthForm({
  mode,
  onModeChange,
  onAuthenticated,
}: {
  mode: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
  onAuthenticated?: () => void;
}) {
  const router = useRouter();
  const auth = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyState, setVerifyState] = useState<{ email: string; password: string } | null>(null);
  const [practiceLanguage, setPracticeLanguage] = useState<LanguageCode>("en");
  const [feedbackLanguage, setFeedbackLanguage] = useState<LanguageCode>("en");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [minorConsentAcknowledged, setMinorConsentAcknowledged] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const title = mode === "signin" ? "Sign in" : mode === "signup" ? "Sign up" : "Reset password";
  const subtitle = mode === "signup"
    ? "Save your practice history, reports, and language preferences."
    : mode === "forgot"
      ? "Enter your email and we will send a reset link."
      : "Continue to your practice dashboard.";

  // isNewSignup must reflect reality (a genuinely new account), not the UI mode this
  // form happened to be in -- the Google button is shared between signup and signin, so
  // mode alone can't tell new from returning. Callers pass the real signal: unambiguous
  // for email (signUpWithEmail vs signInWithEmail are different functions), and for
  // Google it comes back from signInWithGoogle itself (Firebase's own isNewUser).
  async function routeAfterLogin(isNewSignup: boolean) {
    if (onAuthenticated) {
      onAuthenticated();
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo");
    // ProtectedRoute sends a logged-out visitor hitting a protected page (e.g. the
    // pricing page's "Free" CTA, which links to /practice) through here with a returnTo
    // set to wherever they were originally headed. For a genuine new signup, that must
    // not override the quick-start destination -- otherwise it could land on /practice,
    // /dashboard, or anywhere else instead of the intended first-run flow. The one
    // deliberate exception is /try's own "sign up to save this" flow, which sets
    // returnTo itself and genuinely wants new users back on that page.
    if (returnTo && returnTo.startsWith("/") && (!isNewSignup || returnTo === "/try")) {
      router.push(returnTo);
      return;
    }
    // New users go straight to the first-interview quick start; returning users go to dashboard.
    router.push(isNewSignup ? NEW_SIGNUP_DESTINATION : RETURNING_USER_DESTINATION);
  }

  async function handleEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    try {
      if (mode === "forgot") {
        await auth.resetPassword(email);
        setMessage("Password reset email sent. Check your inbox.");
      } else if (mode === "signin") {
        try {
          await auth.signInWithEmail(email, password);
          track.loginCompleted("email");
          await routeAfterLogin(false);
        } catch (err) {
          if (err instanceof Error && err.message === "EMAIL_NOT_VERIFIED") {
            setVerifyState({ email, password });
          } else {
            throw err;
          }
        }
      } else {
        track.signupStarted("email");
        await auth.signUpWithEmail(email, password, practiceLanguage, feedbackLanguage, {
          ageConfirmed,
          minorConsentAcknowledged,
          termsAccepted,
          privacyAccepted,
        });
        track.signupCompleted("email");
        trackCompleteRegistration();
        // Auto-login straight into the app instead of gating on email verification here —
        // the verification email was already sent; unverified users can still practice.
        await routeAfterLogin(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setError("");
    setLoading(true);
    if (mode === "signup") track.signupStarted("google");
    try {
      // Compliance can only be collected up front when the form is in signup mode
      // (that's when the checkboxes render) -- but whether this call turns out to be a
      // genuinely new account is a separate question, answered by the return value.
      const isNewUser = await auth.signInWithGoogle(
        mode === "signup" ? practiceLanguage : undefined,
        mode === "signup" ? feedbackLanguage : undefined,
        mode === "signup" ? { ageConfirmed, minorConsentAcknowledged, termsAccepted, privacyAccepted } : undefined,
      );
      if (isNewUser) {
        track.signupCompleted("google");
        trackCompleteRegistration();
      }
      else track.loginCompleted("google");
      await routeAfterLogin(isNewUser);
    } catch (err) {
      // The user closing the Google popup (or a second popup superseding it) isn't a
      // failure worth a red error banner — it's an intentional cancel.
      const code = (err as { code?: string })?.code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError(err instanceof Error ? err.message : "Google sign-in failed");
      }
    } finally {
      setLoading(false);
    }
  }

  function ConsentRow({
    checked,
    children,
    onChange,
  }: {
    checked: boolean;
    children: ReactNode;
    onChange: (checked: boolean) => void;
  }) {
    return (
      <label className={`flex items-start gap-3 rounded-2xl p-3 text-sm ring-1 transition ${checked ? "bg-violet-50 text-slate-950 ring-violet-200 dark:bg-violet-300/12 dark:text-white dark:ring-violet-200/20" : "bg-white/70 text-slate-700 ring-slate-200 hover:bg-white dark:bg-white/[0.06] dark:text-white/72 dark:ring-white/10"}`}>
        <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md ring-1 ${checked ? "bg-[#6200a8] text-white ring-[#6200a8]" : "bg-white text-transparent ring-slate-300 dark:bg-white/10 dark:ring-white/20"}`}>
          <Check size={13} strokeWidth={3} />
        </span>
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
        <span>{children}</span>
      </label>
    );
  }

  function ModeLink({ nextMode, children }: { nextMode: AuthMode; children: ReactNode }) {
    if (onModeChange) {
      return (
        <button type="button" onClick={() => onModeChange(nextMode)} className="transition hover:text-[#6200a8] dark:hover:text-violet-100">
          {children}
        </button>
      );
    }
    return <Link href={`/?auth=${nextMode}`}>{children}</Link>;
  }

  if (verifyState) {
    return (
      <div className="relative overflow-hidden rounded-[1.5rem] bg-white p-6 shadow-[0_22px_70px_rgba(35,45,75,0.12)] ring-1 ring-slate-200/75 dark:bg-slate-950 dark:ring-white/10 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-300/10" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-48 w-48 rounded-full bg-violet-200/50 blur-3xl dark:bg-violet-400/12" />
        <div className="relative text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-[0_12px_32px_rgba(109,40,217,0.3)]">
            <Mail size={28} className="text-white" />
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.045em] text-slate-950 dark:text-white">Check your inbox</h2>
          <p className="mt-3 text-base font-medium leading-7 text-slate-600 dark:text-white/60">
            We sent a verification link to <span className="font-semibold text-slate-950 dark:text-white">{verifyState.email}</span>.
          </p>
          <p className="mt-2 text-sm font-medium text-slate-400 dark:text-white/40">
            Verify to unlock full session history and PDF downloads. You can start practising right now without waiting.
          </p>
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => { setVerifyState(null); onModeChange?.("signin"); }}
              className="w-full rounded-2xl bg-gradient-to-r from-[#6200a8] via-[#7c00d8] to-[#3b82f6] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_32px_rgba(98,0,168,0.24)] transition hover:-translate-y-0.5"
            >
              Start practising now →
            </button>
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setError("");
                try {
                  await auth.resendVerification(verifyState.email, verifyState.password);
                  setMessage("Verification email resent.");
                } catch {
                  setError("Could not resend. Try signing in again.");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:border-violet-400/40"
            >
              {loading ? "Sending..." : "Resend verification email"}
            </button>
          </div>
          {message && <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{message}</p>}
          {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-400/10 dark:text-red-300">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-white p-6 shadow-[0_22px_70px_rgba(35,45,75,0.12)] ring-1 ring-slate-200/75 dark:bg-slate-950 dark:ring-white/10 sm:p-7">
      <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-300/10" />
      <div className="pointer-events-none absolute -bottom-24 left-8 h-48 w-48 rounded-full bg-violet-200/50 blur-3xl dark:bg-violet-400/12" />
      <div className="relative">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 ring-1 ring-violet-100 dark:bg-white/10 dark:text-violet-100 dark:ring-white/10">
          <Sparkles size={14} /> {mode === "signup" ? "Start free" : "Welcome back"}
        </div>
        <h1 className="text-4xl font-semibold leading-none tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl">{title}</h1>
        <p className="mt-3 text-base font-medium leading-7 text-slate-600 dark:text-white/60">{subtitle}</p>
      </div>

      {mode === "signup" && (
        <div className="relative mt-5 space-y-3">
          <LanguageSelector
            compact
            practiceLanguage={practiceLanguage}
            feedbackLanguage={feedbackLanguage}
            onPracticeLanguageChange={setPracticeLanguage}
            onFeedbackLanguageChange={setFeedbackLanguage}
          />
          <div className="space-y-2 rounded-[1.25rem] bg-slate-50/70 p-3 font-semibold ring-1 ring-slate-200 dark:bg-white/[0.04] dark:ring-white/10">
            <ConsentRow checked={ageConfirmed} onChange={setAgeConfirmed}>I confirm I am at least 16 years old.</ConsentRow>
            <ConsentRow checked={termsAccepted} onChange={setTermsAccepted}>I agree to the <Link href="/terms" className="text-[#6200a8] dark:text-violet-200">Terms</Link>.</ConsentRow>
            <ConsentRow checked={privacyAccepted} onChange={setPrivacyAccepted}>I agree to the <Link href="/privacy" className="text-[#6200a8] dark:text-violet-200">Privacy Policy</Link>.</ConsentRow>
            <ConsentRow checked={minorConsentAcknowledged} onChange={setMinorConsentAcknowledged}>If I am under 18, I have parent or guardian permission.</ConsentRow>
          </div>
        </div>
      )}
      <form onSubmit={handleEmail} className="relative mt-6 space-y-3">
        <input name="email" type="email" required placeholder="Email" className="w-full rounded-2xl border border-slate-200 bg-white/92 px-5 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#8b00ff] focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:focus:ring-violet-300/10" />
        {mode !== "forgot" && <input name="password" type="password" required minLength={6} placeholder="Password" className="w-full rounded-2xl border border-slate-200 bg-white/92 px-5 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#8b00ff] focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:focus:ring-violet-300/10" />}
        <button disabled={loading || (mode === "signup" && (!ageConfirmed || !termsAccepted || !privacyAccepted))} className="w-full rounded-2xl bg-gradient-to-r from-[#6200a8] via-[#7c00d8] to-[#3b82f6] px-5 py-4 text-lg font-bold text-white shadow-[0_18px_44px_rgba(98,0,168,0.24)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50">
          {loading ? "Working..." : title}
        </button>
      </form>
      {mode !== "forgot" && <div className="relative mt-3"><GoogleSignInButton onClick={google} disabled={loading || (mode === "signup" && (!ageConfirmed || !termsAccepted || !privacyAccepted))} /></div>}
      <div className="relative mt-5 flex flex-wrap justify-center gap-4 text-sm font-bold text-slate-600 dark:text-white/60">
        {mode !== "signin" && <ModeLink nextMode="signin">Sign in</ModeLink>}
        {mode !== "signup" && <ModeLink nextMode="signup">Sign up</ModeLink>}
        {mode !== "forgot" && <ModeLink nextMode="forgot">Forgot password?</ModeLink>}
      </div>
      {message && <p className="relative mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}
      {error && <p className="relative mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}
