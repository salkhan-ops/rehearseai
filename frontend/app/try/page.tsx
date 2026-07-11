"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
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

// These two scenarios are grounded in real background material — the AI needs a CV and
// the role it's being weighed against to ask questions that trace to actual specifics
// instead of generic ones.
const DOCUMENT_TEMPLATES: Partial<Record<(typeof QUICK_STARTS)[number]["type"], { resume: string; job: string }>> = {
  "Job Interview": {
    resume: "Product Marketing Manager with 5 years of experience leading go-to-market launches for B2B SaaS products. Grew qualified pipeline 40% YoY by rebuilding positioning and messaging for our flagship product. Managed a team of 2 and partnered closely with sales, product, and design. Previously worked in growth marketing at an early-stage startup.",
    job: "Hiring a Senior Product Marketing Manager to own positioning, launches, and sales enablement for our core platform. You'll work cross-functionally with product, sales, and design, reporting to the VP of Marketing. Looking for 4+ years of B2B SaaS marketing experience and a track record of driving measurable pipeline growth.",
  },
  "Salary Negotiation": {
    resume: "Senior Software Engineer with 6 years of experience, currently earning $125,000 base. Led the migration of our core service to a new architecture, cutting infra costs by 30%. Consistently rated a top performer and mentors two junior engineers.",
    job: "Received a competing offer from another company: $140,000 base plus equity for a similar senior engineering role. Bringing this to my current manager to negotiate a raise and see if they can match or beat it before I decide.",
  },
};

function buildDocumentText(resume: string, job: string) {
  return `=== CANDIDATE CV / RESUME ===\n${resume.trim()}\n\n=== JOB OPPORTUNITY / ROLE DETAILS ===\n${job.trim()}`;
}

export default function TryPage() {
  const router = useRouter();
  const { getToken, loading: authLoading, profile, user, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");

  async function startQuickSession(type: string, context: string, goal: string, documentText?: string) {
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
        // Quick-start trial sessions run at Advanced so first-time visitors immediately feel
        // the AI push back and challenge vague answers — the product's actual differentiator —
        // rather than a soft Intermediate exchange. Advanced is unlocked on every plan, unlike
        // Brutal/Nerve, so this doesn't give away a paid pressure mode for free.
        difficulty: "Advanced",
        topic: type,
        context,
        goal,
        practiceLanguage: "en",
        feedbackLanguage: "en",
        durationPreference: 10,
        environmentMode: "AI Orb",
        preferredConversationMode: "natural",
        ...(documentText ? { documentText, documentMode: "profile" as const } : {}),
      }, token);
      router.push(`/session/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the session — please try again.");
      setLoading(false);
    }
  }

  function handleCardClick(type: string, context: string, goal: string) {
    if (!user) {
      router.push("/?auth=signup&returnTo=/try");
      return;
    }
    if (DOCUMENT_TEMPLATES[type as keyof typeof DOCUMENT_TEMPLATES]) {
      setError("");
      setExpandedType((current) => (current === type ? null : type));
      setResumeText("");
      setJobText("");
      return;
    }
    startQuickSession(type, context, goal);
  }

  function fillTemplate(type: string) {
    const template = DOCUMENT_TEMPLATES[type as keyof typeof DOCUMENT_TEMPLATES];
    if (!template) return;
    setResumeText(template.resume);
    setJobText(template.job);
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

        <div className="mt-10 grid gap-4 text-left">
          {QUICK_STARTS.map(({ type, label, emoji, context, goal }) => {
            const needsDocuments = Boolean(DOCUMENT_TEMPLATES[type as keyof typeof DOCUMENT_TEMPLATES]);
            const expanded = expandedType === type;
            const canStart = resumeText.trim().length > 0 && jobText.trim().length > 0;
            return (
              <div key={type} className={`overflow-hidden rounded-[1.5rem] surface-high ring-1 transition ${expanded ? "ring-[var(--accent-primary)]" : "ring-[var(--border-soft)]"}`}>
                <button
                  type="button"
                  disabled={loading || authLoading}
                  onClick={() => handleCardClick(type, context, goal)}
                  className="flex w-full items-center justify-between p-6 text-left transition hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{emoji}</span>
                    <div>
                      <p className="text-lg font-semibold text-primary-token">{label}</p>
                      <p className="mt-0.5 text-sm font-medium text-secondary-token">{goal}</p>
                    </div>
                  </div>
                  {loading && expanded ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
                  ) : needsDocuments ? (
                    <ChevronDown size={20} className={`shrink-0 text-secondary-token transition-transform ${expanded ? "rotate-180" : ""}`} />
                  ) : (
                    <ArrowRight size={20} className="shrink-0 text-secondary-token" />
                  )}
                </button>

                {needsDocuments && expanded && (
                  <div className="border-t border-[var(--border-soft)] p-6 pt-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-secondary-token">
                        Add your CV and the role — the AI grounds its questions in both. 30 seconds, or use an example.
                      </p>
                      <button
                        type="button"
                        onClick={() => fillTemplate(type)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--accent-primary)]/10 px-3 py-2 text-xs font-bold text-[var(--accent-primary)] transition hover:bg-[var(--accent-primary)]/15"
                      >
                        <Sparkles size={13} /> Use example
                      </button>
                    </div>

                    <label className="mt-4 block text-xs font-semibold text-secondary-token">
                      Your CV / résumé
                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value.slice(0, 4000))}
                        rows={4}
                        placeholder="Paste your CV, LinkedIn summary, or a few lines about your background…"
                        className="mt-2 w-full resize-none rounded-2xl border border-[var(--border-soft)] bg-transparent px-4 py-3 text-sm font-medium text-primary-token outline-none placeholder:text-secondary-token/60 focus:border-[var(--accent-primary)]"
                      />
                    </label>

                    <label className="mt-3 block text-xs font-semibold text-secondary-token">
                      Job opportunity / description
                      <textarea
                        value={jobText}
                        onChange={(e) => setJobText(e.target.value.slice(0, 4000))}
                        rows={4}
                        placeholder="Paste the job posting, offer details, or a few lines about the role…"
                        className="mt-2 w-full resize-none rounded-2xl border border-[var(--border-soft)] bg-transparent px-4 py-3 text-sm font-medium text-primary-token outline-none placeholder:text-secondary-token/60 focus:border-[var(--accent-primary)]"
                      />
                    </label>

                    <button
                      type="button"
                      disabled={!canStart || loading}
                      onClick={() => startQuickSession(type, context, goal, buildDocumentText(resumeText, jobText))}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                      {loading ? "Starting…" : "Start session"} <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
