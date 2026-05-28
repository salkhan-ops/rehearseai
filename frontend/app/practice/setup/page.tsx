"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FormEvent, useEffect, useState } from "react";
import { AnimatedPage } from "@/components/animations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Nav } from "@/components/Nav";
import { createSession } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { canUsePracticeType, getUserEntitlements } from "@/lib/entitlements";
import { difficulties, Difficulty, practiceTypes, PracticeType } from "@/lib/types";
import type { Entitlements } from "@/lib/admin";

function SetupForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [practiceType, setPracticeType] = useState<PracticeType>((params.get("type") as PracticeType) || "Job Interview");
  const [difficulty, setDifficulty] = useState<Difficulty>((params.get("difficulty") as Difficulty) || "Realistic");
  const [loading, setLoading] = useState(false);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [error, setError] = useState("");
  const { getToken, userId } = useAuth();

  useEffect(() => {
    getUserEntitlements(userId).then(setEntitlements).catch(() => undefined);
  }, [userId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (entitlements) {
      if (difficulty === "Brutal" && !entitlements.allowBrutalMode) {
        setError("Brutal mode requires Pro or Coach.");
        return;
      }
      if (!canUsePracticeType(entitlements, practiceType)) {
        setError("This practice mode is not included in your current plan.");
        return;
      }
    }
    setLoading(true);
    const data = new FormData(event.currentTarget);
    const token = await getToken();
    const session = await createSession({
      userId,
      practiceType,
      difficulty,
      topic: String(data.get("topic")),
      context: String(data.get("context")),
      goal: String(data.get("goal")),
      optionalNotes: String(data.get("optionalNotes") || "")
    }, token);
    router.push(`/session/${session.id}`);
  }

  return (
    <main className="min-h-screen bg-[#f4f8fc] dark:bg-[#0e1020]">
      <Nav />
      <AnimatedPage className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-5xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white md:text-6xl">Set up your rehearsal</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-[1.75rem] bg-white p-5 shadow-[0_18px_55px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10 md:p-8">
          <label className="block text-sm font-semibold text-slate-700 dark:text-white/75">Practice type
            <select value={practiceType} onChange={(event) => setPracticeType(event.target.value as PracticeType)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-[#8b00ff] dark:border-white/10 dark:bg-white/10 dark:text-white">
              {practiceTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-white/75">Topic
            <input name="topic" required className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-[#8b00ff] dark:border-white/10 dark:bg-white/10 dark:text-white" placeholder="Senior product manager interview" />
          </label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-white/75">Context
            <textarea name="context" required rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-[#8b00ff] dark:border-white/10 dark:bg-white/10 dark:text-white" placeholder="I have a final round interview with a skeptical VP..." />
          </label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-white/75">Goal
            <input name="goal" required className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-[#8b00ff] dark:border-white/10 dark:bg-white/10 dark:text-white" placeholder="Sound clear, calm, and senior under pressure" />
          </label>
          <div>
            <div className="text-sm font-semibold text-slate-700 dark:text-white/75">Difficulty</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {difficulties.map((item) => (
                <button key={item} type="button" disabled={item === "Brutal" && entitlements?.allowBrutalMode === false} onClick={() => setDifficulty(item)} className={`rounded-2xl px-4 py-3 text-sm font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-45 ${difficulty === item ? "bg-[#6200a8] text-white ring-[#6200a8]" : "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-white/70 dark:ring-white/10"}`}>{item}</button>
              ))}
            </div>
          </div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-white/75">Optional notes
            <textarea name="optionalNotes" rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-[#8b00ff] dark:border-white/10 dark:bg-white/10 dark:text-white" placeholder="Anything the AI should know?" />
          </label>
          {error && <p className="rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
          <button disabled={loading} className="w-full rounded-2xl bg-[#6200a8] px-5 py-4 font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.24)] transition hover:bg-[#50008b] disabled:opacity-60">{loading ? "Creating..." : "Start session"}</button>
        </form>
      </AnimatedPage>
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<main><Nav /><div className="px-4 py-12 text-center font-bold">Loading setup...</div></main>}>
      <ProtectedRoute><SetupForm /></ProtectedRoute>
    </Suspense>
  );
}
