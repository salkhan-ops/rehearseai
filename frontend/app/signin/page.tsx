"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/animations";
import { Nav } from "@/components/Nav";
import { useAuth } from "@/lib/auth";

export default function SignInPage() {
  const router = useRouter();
  const { continueAsGuest, signInEmail, signInGoogle, signUpEmail, user, logout } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    try {
      if (mode === "signin") {
        await signInEmail(email, password);
      } else {
        await signUpEmail(email, password);
      }
      router.push("/practice");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function run(action: () => Promise<void>) {
    setError("");
    setLoading(true);
    try {
      await action();
      router.push("/practice");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f8fc] dark:bg-[#0e1020]">
      <Nav />
      <AnimatedPage className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-[1.75rem] bg-white p-7 shadow-[0_18px_55px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
          <h1 className="text-4xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white">Sign in</h1>
          <p className="mt-3 font-medium leading-7 text-slate-600 dark:text-white/60">Use Firebase Auth to save sessions to your account. Guest mode signs in anonymously.</p>
          {user && (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-white/10 dark:text-white/70">
              Signed in as <span className="font-bold">{user.email || user.uid}</span>
              <button onClick={() => run(logout)} className="mt-3 w-full rounded-2xl bg-white px-4 py-3 font-semibold ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">Sign out</button>
            </div>
          )}
          <form onSubmit={handleEmail} className="mt-6 space-y-3">
            <input name="email" type="email" required placeholder="Email" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-[#8b00ff] dark:border-white/10 dark:bg-white/10 dark:text-white" />
            <input name="password" type="password" required minLength={6} placeholder="Password" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-[#8b00ff] dark:border-white/10 dark:bg-white/10 dark:text-white" />
            <button disabled={loading} className="w-full rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.24)] disabled:opacity-60">
              {loading ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-3 w-full rounded-2xl bg-slate-50 px-5 py-3 font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/70 dark:ring-white/10">
            {mode === "signin" ? "Create a new account" : "I already have an account"}
          </button>
          <button onClick={() => run(signInGoogle)} disabled={loading} className="mt-3 w-full rounded-2xl bg-slate-50 px-5 py-3 font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/70 dark:ring-white/10">Continue with Google</button>
          <button onClick={() => run(continueAsGuest)} disabled={loading} className="mt-3 w-full rounded-2xl bg-white px-5 py-3 font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/70 dark:ring-white/10">Continue as guest</button>
          {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        </div>
      </AnimatedPage>
    </main>
  );
}
