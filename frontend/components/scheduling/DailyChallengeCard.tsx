"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Flame, Shuffle } from "lucide-react";
import { quickStartChallenge } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { DailyChallenge, Difficulty, PracticeType } from "@/lib/types";

export function DailyChallengeCard({ challenge }: { challenge: DailyChallenge | null }) {
  const router = useRouter();
  const { getToken, profile, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start(category?: PracticeType, difficulty?: Difficulty) {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const result = await quickStartChallenge({
        userId,
        category: category || challenge?.scenario.category || "Job Interview",
        difficulty: difficulty || challenge?.scenario.difficulty || "Realistic",
        practiceLanguage: profile?.preferredPracticeLanguage || "en",
        feedbackLanguage: profile?.preferredFeedbackLanguage || "en",
        durationPreference: 10,
      }, token);
      router.push(`/session/${result.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start challenge.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] surface-high p-6">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="relative">
        <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]"><Flame size={16} /> Daily cognitive challenge</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-primary-token">{challenge?.title || "Today's Cognitive Challenge"}</h2>
        <p className="mt-3 font-medium leading-7 text-secondary-token">{challenge?.objective || "Start a fresh adaptive scenario designed to train composure, reasoning, and concise communication."}</p>
        {challenge?.scenario && (
          <div className="mt-5 rounded-[1.5rem] surface-medium p-4">
            <div className="text-sm font-semibold text-tertiary-token">{challenge.scenario.category} · {challenge.scenario.difficulty}</div>
            <p className="mt-2 font-medium leading-7 text-secondary-token">{challenge.scenario.setting}</p>
          </div>
        )}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button onClick={() => start()} disabled={loading} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-4 font-semibold text-white shadow-[0_18px_42px_rgba(98,0,168,0.24)] disabled:opacity-60">
            {loading ? "Building challenge..." : "Start today"} <ArrowRight size={18} />
          </button>
          <button onClick={() => start("Difficult Conversation", "Realistic")} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl surface-low px-5 py-4 font-semibold text-secondary-token ring-1 ring-[var(--border-soft)]">
            <Shuffle size={18} /> Random
          </button>
        </div>
        {error && <p className="mt-3 rounded-2xl bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-500">{error}</p>}
      </div>
    </section>
  );
}
