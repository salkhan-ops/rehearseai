"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import { BrainCircuit, Check, LockKeyhole, Sparkles, Target, Waves } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { LanguageCode } from "@/lib/languages";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { AIDisclaimer } from "@/components/legal/AIDisclaimer";
import { GoogleSignInButton } from "./GoogleSignInButton";

const signupSignals = [
  { icon: BrainCircuit, label: "Adaptive practice memory" },
  { icon: Target, label: "Protected reports" },
  { icon: Waves, label: "Voice-first sessions" },
];

export function AuthForm({ mode }: { mode: "signin" | "signup" | "forgot" }) {
  const router = useRouter();
  const auth = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [practiceLanguage, setPracticeLanguage] = useState<LanguageCode>("en");
  const [feedbackLanguage, setFeedbackLanguage] = useState<LanguageCode>("en");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [minorConsentAcknowledged, setMinorConsentAcknowledged] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const title = mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password";
  const subtitle = mode === "signup"
    ? "Build a private training profile for high-stakes conversations, pressure recovery, and reasoning growth."
    : mode === "forgot"
      ? "Reset your password and get back to your rehearsal history."
      : "Save your cognitive performance history and protected reports with Firebase Authentication.";

  async function routeAfterLogin() {
    router.push("/dashboard");
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
        setMessage("Password reset email sent.");
      } else if (mode === "signin") {
        await auth.signInWithEmail(email, password);
        await routeAfterLogin();
      } else {
        await auth.signUpWithEmail(email, password, practiceLanguage, feedbackLanguage, {
          ageConfirmed,
          minorConsentAcknowledged,
          termsAccepted,
          privacyAccepted,
        });
        await routeAfterLogin();
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
    try {
      await auth.signInWithGoogle(
        mode === "signup" ? practiceLanguage : undefined,
        mode === "signup" ? feedbackLanguage : undefined,
        mode === "signup" ? { ageConfirmed, minorConsentAcknowledged, termsAccepted, privacyAccepted } : undefined,
      );
      await routeAfterLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
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
      <label className={`flex items-start gap-3 rounded-2xl p-3 ring-1 transition ${checked ? "bg-violet-50 text-slate-950 ring-violet-200 dark:bg-violet-300/12 dark:text-white dark:ring-violet-200/20" : "bg-white/70 text-slate-700 ring-slate-200 hover:bg-white dark:bg-white/[0.06] dark:text-white/72 dark:ring-white/10"}`}>
        <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg ring-1 ${checked ? "bg-[#6200a8] text-white ring-[#6200a8]" : "bg-white text-transparent ring-slate-300 dark:bg-white/10 dark:ring-white/20"}`}>
          <Check size={15} strokeWidth={3} />
        </span>
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
        <span>{children}</span>
      </label>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-white p-7 shadow-[0_24px_80px_rgba(35,45,75,0.10)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
      <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-cyan-200/45 blur-3xl dark:bg-cyan-300/10" />
      <div className="pointer-events-none absolute -bottom-20 left-8 h-52 w-52 rounded-full bg-violet-200/55 blur-3xl dark:bg-violet-400/12" />
      <div className="relative">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-violet-100 dark:bg-white/10 dark:text-violet-100 dark:ring-white/10">
          <Sparkles size={16} /> {mode === "signup" ? "Start your training profile" : "Welcome back"}
        </div>
        <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-4 text-lg font-medium leading-8 text-slate-600 dark:text-white/60">{subtitle}</p>
      </div>

      {mode === "signup" && (
        <div className="relative mt-5 grid gap-2 sm:grid-cols-3">
          {signupSignals.map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-200 dark:bg-white/[0.06] dark:ring-white/10">
              <Icon size={18} className="text-[#6200a8] dark:text-violet-100" />
              <div className="mt-2 text-xs font-bold leading-5 text-slate-600 dark:text-white/62">{label}</div>
            </div>
          ))}
        </div>
      )}

      {mode === "signup" && (
        <div className="relative mt-5 space-y-3">
          <AIDisclaimer compact />
          <LanguageSelector
            compact
            practiceLanguage={practiceLanguage}
            feedbackLanguage={feedbackLanguage}
            onPracticeLanguageChange={setPracticeLanguage}
            onFeedbackLanguageChange={setFeedbackLanguage}
          />
          <div className="space-y-2 rounded-[1.5rem] bg-slate-50/70 p-3 text-sm font-semibold ring-1 ring-slate-200 dark:bg-white/[0.04] dark:ring-white/10">
            <ConsentRow checked={ageConfirmed} onChange={setAgeConfirmed}>I confirm I am at least 16 years old.</ConsentRow>
            <ConsentRow checked={minorConsentAcknowledged} onChange={setMinorConsentAcknowledged}>If I am under 18, I should use RehearseAI with permission from a parent or guardian.</ConsentRow>
            <ConsentRow checked={termsAccepted} onChange={setTermsAccepted}>I agree to the <Link href="/terms" className="text-[#6200a8] dark:text-violet-200">Terms</Link>.</ConsentRow>
            <ConsentRow checked={privacyAccepted} onChange={setPrivacyAccepted}>I agree to the <Link href="/privacy" className="text-[#6200a8] dark:text-violet-200">Privacy Policy</Link>.</ConsentRow>
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
        {mode !== "signin" && <Link href="/signin">Sign in</Link>}
        {mode !== "signup" && <Link href="/signup">Create account</Link>}
        {mode !== "forgot" && <Link href="/forgot-password">Forgot password?</Link>}
      </div>
      {message && <p className="relative mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}
      {error && <p className="relative mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {mode !== "forgot" && (
        <div className="relative mt-5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-white/35">
          <LockKeyhole size={14} /> Secured by Firebase Auth
        </div>
      )}
    </div>
  );
}
