"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { createSession } from "@/lib/api";
import { track } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";

const QUICK_STARTS = [
  {
    type: "Job Interview",
    label: "Job Interview",
    emoji: "💼",
    context: "A job interview for a role I am applying for.",
    goal: "Communicate my experience clearly and handle tough follow-up questions.",
  },
  {
    type: "Salary Negotiation",
    label: "Salary Negotiation",
    emoji: "💰",
    context: "Negotiating my salary or a job offer with a hiring manager.",
    goal: "Hold my target number and handle pushback without caving.",
  },
  {
    type: "Presentation / Public Speaking",
    label: "Presentation",
    emoji: "🎤",
    context: "Presenting an idea, project, or pitch to an audience.",
    goal: "Stay clear and confident when questioned or challenged.",
  },
] as const;

export default function TryPage() {
  const router = useRouter();
  const { getToken, loading: authLoading, profile, user, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startQuickSession(type: string, context: string, goal: string) {
    if (!user) {
      router.push("/?auth=signup&returnTo=/try");
      return;
    }
    setLoading(true);
    setError("");
    track.ctaClicked("quick_try_" + type.toLowerCase().replace(/\s/g, "_"));
    try {
      const token = await getToken();
      const session = await createSession({
        userId,
        practiceType: type as never,
        difficulty: "Intermediate",
        topic: type,
        context,
        goal,
        practiceLanguage: "en",
        feedbackLanguage: "en",
        durationPreference: 10,
        environmentMode: "AI Orb",
        preferredConversationMode: "natural",
      }, token);
      router.push(`/session/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the session — please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="cog-bg min-h-screen text-primary-token">
      <Nav />
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="inline-flex items-center gap-2 rounded-full surface-low px-4 py-2 text-sm font-semibold text-secondary-token">
          {user ? "Quick practice · saved to your account" : "Free account required · no card needed"}
        </p>
        <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-primary-token md:text-6xl">
          Pick a scenario.<br />Start talking.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-lg font-medium leading-7 text-secondary-token">
          {user
            ? "Choose a scenario and go straight into a saved practice session."
            : "Create a free account to protect your session, save your report, and track progress."}
        </p>

        <div className="mt-10 grid gap-4">
          {QUICK_STARTS.map(({ type, label, emoji, context, goal }) => (
            <button
              key={type}
              type="button"
              disabled={loading || authLoading}
              onClick={() => startQuickSession(type, context, goal)}
              className="flex items-center justify-between rounded-[1.5rem] surface-high p-6 text-left ring-1 ring-[var(--border-soft)] transition hover:-translate-y-0.5 hover:ring-[var(--accent-primary)] disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{emoji}</span>
                <div>
                  <p className="text-lg font-semibold text-primary-token">{label}</p>
                  <p className="mt-0.5 text-sm font-medium text-secondary-token">{goal}</p>
                </div>
              </div>
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
              ) : (
                <ArrowRight size={20} className="shrink-0 text-secondary-token" />
              )}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
            {error}
          </p>
        )}

        {user ? (
          <p className="mt-8 text-sm font-medium text-secondary-token">
            Results will be saved to {profile?.displayName || user.displayName || "your account"}.{" "}
            <a href="/history" className="font-semibold text-[var(--accent-primary)] underline underline-offset-2">View session history</a>
          </p>
        ) : (
          <p className="mt-8 text-sm font-medium text-secondary-token">
            Already have an account?{" "}
            <a href="/?auth=signin&returnTo=/try" className="font-semibold text-[var(--accent-primary)] underline underline-offset-2">Sign in</a>
          </p>
        )}

        {/* What to expect — reduces cold-start anxiety before the first session */}
        <div className="mt-14 rounded-[1.75rem] surface-low p-6 text-left ring-1 ring-[var(--border-soft)]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary-token">What to expect</p>
          <div className="mt-4 space-y-3">
            {[
              { role: "ai", text: "Tell me — why are you the right candidate for this role?" },
              { role: "user", text: "I have three years of experience in product and led two product launches…" },
              { role: "ai", text: "That's broad. Give me one specific decision you made that a weaker candidate wouldn't have made." },
            ].map((turn, i) => (
              <div key={i} className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium leading-6 ${
                  turn.role === "ai"
                    ? "rounded-tl-sm bg-white/60 text-primary-token ring-1 ring-[var(--border-soft)] dark:bg-white/10"
                    : "rounded-tr-sm bg-[#6200a8]/80 text-white"
                }`}>
                  <span className={`mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] ${turn.role === "ai" ? "text-[var(--accent-primary)]/60" : "text-violet-200/60"}`}>
                    {turn.role === "ai" ? "AI" : "You"}
                  </span>
                  {turn.text}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-secondary-token">
            <span>~10 minutes</span>
            <span className="h-1 w-1 rounded-full bg-current opacity-40" />
            <span>Voice or text</span>
            <span className="h-1 w-1 rounded-full bg-current opacity-40" />
            <span>Confidence · Clarity · Calmness · Structure scored</span>
          </div>
        </div>
      </div>
    </main>
  );
}
