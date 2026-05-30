"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Shuffle, Zap } from "lucide-react";
import { quickStartChallenge } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Difficulty, PracticeType } from "@/lib/types";

const randomCategories: PracticeType[] = ["Job Interview", "Panel Discussion", "Difficult Conversation", "Salary Negotiation", "Sales Pitch"];

export function RandomChallengeButton({ category, difficulty = "Realistic" }: { category?: PracticeType; difficulty?: Difficulty }) {
  const router = useRouter();
  const { getToken, profile, userId } = useAuth();
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    const selected = category || randomCategories[Math.floor(Math.random() * randomCategories.length)];
    try {
      const token = await getToken();
      const result = await quickStartChallenge({
        userId,
        category: selected,
        difficulty,
        practiceLanguage: profile?.preferredPracticeLanguage || "en",
        feedbackLanguage: profile?.preferredFeedbackLanguage || "en",
        durationPreference: 10,
      }, token);
      router.push(`/session/${result.session.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={start} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white shadow-[0_16px_38px_rgba(98,0,168,0.24)] transition hover:-translate-y-0.5 disabled:opacity-60">
      {loading ? <Zap size={18} /> : <Shuffle size={18} />} {loading ? "Building scenario..." : "Start Random Challenge"}
    </button>
  );
}
