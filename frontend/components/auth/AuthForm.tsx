"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { isAdmin, useAuth } from "@/lib/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import type { LanguageCode } from "@/lib/languages";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { AIDisclaimer } from "@/components/legal/AIDisclaimer";
import { GoogleSignInButton } from "./GoogleSignInButton";

export function AuthForm({ mode }: { mode: "signin" | "signup" | "forgot" }) {
  const router = useRouter();
  const auth = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [practiceLanguage, setPracticeLanguage] = useState<LanguageCode>("en");
  const [feedbackLanguage, setFeedbackLanguage] = useState<LanguageCode>("en");
  const title = mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password";

  async function routeAfterLogin() {
    const uid = getFirebaseAuth()?.currentUser?.uid;
    router.push(uid && await isAdmin(uid) ? "/admin" : "/dashboard");
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
        await auth.signUpWithEmail(email, password, practiceLanguage, feedbackLanguage);
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
      await auth.signInWithGoogle(mode === "signup" ? practiceLanguage : undefined, mode === "signup" ? feedbackLanguage : undefined);
      await routeAfterLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[1.75rem] bg-white p-7 shadow-[0_18px_55px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
      <h1 className="text-4xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white">{title}</h1>
      <p className="mt-3 font-medium leading-7 text-slate-600 dark:text-white/60">Save your cognitive performance history and protected reports with Firebase Authentication.</p>
      {mode === "signup" && (
        <div className="mt-5 space-y-3">
          <AIDisclaimer compact />
          <LanguageSelector
            compact
            practiceLanguage={practiceLanguage}
            feedbackLanguage={feedbackLanguage}
            onPracticeLanguageChange={setPracticeLanguage}
            onFeedbackLanguageChange={setFeedbackLanguage}
          />
        </div>
      )}
      <form onSubmit={handleEmail} className="mt-6 space-y-3">
        <input name="email" type="email" required placeholder="Email" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-[#8b00ff] dark:border-white/10 dark:bg-white/10 dark:text-white" />
        {mode !== "forgot" && <input name="password" type="password" required minLength={6} placeholder="Password" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-[#8b00ff] dark:border-white/10 dark:bg-white/10 dark:text-white" />}
        <button disabled={loading} className="w-full rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.24)] disabled:opacity-60">
          {loading ? "Working..." : title}
        </button>
      </form>
      {mode !== "forgot" && <div className="mt-3"><GoogleSignInButton onClick={google} disabled={loading} /></div>}
      <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm font-semibold text-slate-600 dark:text-white/60">
        {mode !== "signin" && <Link href="/signin">Sign in</Link>}
        {mode !== "signup" && <Link href="/signup">Create account</Link>}
        {mode !== "forgot" && <Link href="/forgot-password">Forgot password?</Link>}
      </div>
      {message && <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}
      {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}
