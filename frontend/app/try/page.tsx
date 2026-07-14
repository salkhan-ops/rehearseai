"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, Mic, Sparkles } from "lucide-react";
import { Nav } from "@/components/Nav";
import { WhatYouGet } from "@/components/home/WhatYouGet";
import { createSession } from "@/lib/api";
import { track } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { sessionHref } from "@/lib/routes";

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

const CONVERSATION_BEATS = [
  { speaker: "ai", state: "speaking", line: "Tell me — why are you the right candidate for this role?" },
  { speaker: "user", state: "listening", line: "I have three years of experience in product and led two product launches…" },
  { speaker: "ai", state: "thinking", line: "That's broad. Give me one specific decision a weaker candidate wouldn't have made." },
] as const;

// A voice orb + rotating captions, not chat bubbles — the product is a spoken
// conversation, and a text thread here would misrepresent what "start free" gets you.
function ConversationPreview() {
  const reduce = useReducedMotion();
  const [beatIndex, setBeatIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setBeatIndex((i) => (i + 1) % CONVERSATION_BEATS.length), 3200);
    return () => clearInterval(id);
  }, [reduce]);

  const beat = CONVERSATION_BEATS[beatIndex];
  const active = beat.state !== "thinking";

  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-[1.75rem] surface-low px-6 py-10 ring-1 ring-[var(--border-soft)]">
      <div className="relative grid h-40 w-40 place-items-center">
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-300/40 via-violet-400/40 to-blue-500/25 blur-2xl"
          animate={reduce ? undefined : { scale: [0.94, 1.08, 0.96], opacity: [0.55, 0.9, 0.6] }}
          transition={{ duration: beat.state === "speaking" ? 2 : 3.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute h-28 w-28 rounded-full border border-[var(--accent-primary)]/25"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="relative h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-violet-200 via-cyan-200 to-blue-300 shadow-[0_0_60px_rgba(129,140,248,0.5)]"
          animate={reduce ? undefined : { scale: active ? [1, 1.06, 1] : [0.97, 1, 0.97] }}
          transition={{ duration: beat.state === "speaking" ? 1.4 : 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.9),transparent_25%)]" />
        </motion.div>
        {/* Waveform bars — reads as "listening/speaking," not "typing" */}
        <div className="absolute -bottom-2 flex items-end gap-[3px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <motion.span
              key={i}
              className="w-[3px] rounded-full bg-[var(--accent-primary)]"
              animate={reduce ? undefined : { height: active ? [4, 6 + (i % 5) * 5, 4] : [4, 5, 4] }}
              transition={{ duration: 0.7 + (i % 4) * 0.12, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-secondary-token">
        <Mic size={11} />
        {beat.speaker === "ai" ? (beat.state === "thinking" ? "AI thinking" : "AI speaking") : "You — speaking"}
      </div>

      <div className="relative mt-3 h-14 w-full max-w-sm">
        <motion.p
          key={beatIndex}
          initial={reduce ? undefined : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center text-sm font-semibold leading-6 text-primary-token"
        >
          “{beat.line}”
        </motion.p>
      </div>
    </div>
  );
}

export default function TryPage() {
  const router = useRouter();
  const { getToken, loading: authLoading, profile, user, userId, signInAnonymously } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  // Set right after an anonymous guest sign-in resolves, and used to bridge the very
  // next action (starting the session) -- the `user`/`getToken()` from useAuth() come
  // from React state driven by onAuthStateChanged, which isn't guaranteed to have
  // caught up in the same tick signInAnonymously's promise resolves in.
  const [guestAuth, setGuestAuth] = useState<{ uid: string; token: string | null } | null>(null);
  const [consentPending, setConsentPending] = useState<{ type: string; context: string; goal: string } | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  async function startQuickSession(type: string, context: string, goal: string, documentText?: string, overrideAuth?: { uid: string; token: string | null }) {
    if (!overrideAuth && !user) {
      router.push("/?auth=signup&returnTo=/try");
      return;
    }
    setLoading(true);
    setError("");
    track.ctaClicked("quick_try_" + type.toLowerCase().replace(/\s/g, "_"));
    try {
      const token = overrideAuth ? overrideAuth.token : await getToken();
      const session = await createSession({
        userId: overrideAuth?.uid ?? userId,
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
      const isGuest = Boolean(overrideAuth) || Boolean(user?.isAnonymous);
      router.push(sessionHref(session.id, { guest: isGuest ? "true" : undefined }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the session — please try again.");
      setLoading(false);
    }
  }

  function handleCardClick(type: string, context: string, goal: string) {
    if (!user) {
      // No hard signup wall -- collect the one legally-required consent tap, then start
      // an anonymous trial session immediately. Signup is asked for only after they've
      // actually talked to the AI (see the guest-report gate on the session page).
      setError("");
      setConsentPending({ type, context, goal });
      return;
    }
    if (user.isAnonymous && profile?.guestTrialUsed) {
      // Already used their one free anonymous trial in this browser -- further scenarios
      // require a real account rather than looping free AI-backed sessions.
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

  async function beginGuestTrial() {
    if (!consentPending || !consentChecked) return;
    setLoading(true);
    setError("");
    try {
      const auth = await signInAnonymously({
        ageConfirmed: true,
        minorConsentAcknowledged: false,
        termsAccepted: true,
        privacyAccepted: true,
      });
      const { type, context, goal } = consentPending;
      // Marks the start of the anonymous-auth funnel leg (guest_trial_started ->
      // first_ai_question_shown -> ... -> signup_completed) -- previously the only
      // visible step in this path was the very end, so a stall between the CTA click
      // and a real account being created was invisible.
      track.guestTrialStarted(type);
      setConsentPending(null);
      setConsentChecked(false);
      if (DOCUMENT_TEMPLATES[type as keyof typeof DOCUMENT_TEMPLATES]) {
        setGuestAuth(auth);
        setExpandedType(type);
        setLoading(false);
      } else {
        await startQuickSession(type, context, goal, undefined, auth);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start your free trial — please try again.");
      setLoading(false);
    }
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
          {user && !user.isAnonymous
            ? "Quick practice · saved to your account"
            : user?.isAnonymous
              ? "Free trial · sign up after to save it"
              : "Free to start · no account needed"}
        </p>
        <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-primary-token md:text-6xl">
          Pick a scenario.<br />Start talking.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-lg font-medium leading-7 text-secondary-token">
          {user && !user.isAnonymous
            ? "Choose a scenario and go straight into a saved practice session."
            : user?.isAnonymous
              ? "Pick another scenario and go straight in — you'll be asked to save your results afterward."
              : "Pick a scenario and start talking immediately. Create a free account afterward to save your results."}
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
                      onClick={() => startQuickSession(type, context, goal, buildDocumentText(resumeText, jobText), guestAuth ?? undefined)}
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

        {user && !user.isAnonymous ? (
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

        {/* What you get afterward -- this was previously invisible until someone finished
            a session and hit the signup wall; showing it up front here answers "what do I
            actually get" before someone commits to talking to the AI. */}
        <div className="mt-14 text-left">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary-token">What you get after every session</p>
          <div className="mt-4">
            <WhatYouGet />
          </div>
        </div>

        {/* What to expect — reduces cold-start anxiety before the first session */}
        <div className="mt-8 rounded-[1.75rem] surface-low p-6 text-left ring-1 ring-[var(--border-soft)]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary-token">What to expect</p>
          <div className="mt-4">
            <ConversationPreview />
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

      {consentPending && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 py-5 backdrop-blur-md" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close"
            onClick={() => { if (!loading) { setConsentPending(null); setConsentChecked(false); } }}
          />
          <div className="relative w-full max-w-md rounded-[1.5rem] bg-white p-6 shadow-2xl dark:bg-[#101827]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-primary)]">One tap to start</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-primary-token">Jump straight in — no account needed yet</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-secondary-token">
              Talk to the AI right now. We&apos;ll ask you to save your results afterward.
            </p>
            <label className="mt-4 flex items-start gap-3 rounded-2xl surface-low p-3 text-sm ring-1 ring-[var(--border-soft)]">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-[var(--accent-primary)]"
              />
              <span className="text-secondary-token">
                I confirm I am at least 16 (with parent or guardian permission if under 18), and I agree to the{" "}
                <a href="/terms" target="_blank" className="font-semibold text-[var(--accent-primary)] underline underline-offset-2">Terms</a> and{" "}
                <a href="/privacy" target="_blank" className="font-semibold text-[var(--accent-primary)] underline underline-offset-2">Privacy Policy</a>.
              </span>
            </label>
            {error && (
              <p className="mt-3 text-sm font-semibold text-rose-600 dark:text-rose-300">{error}</p>
            )}
            <button
              type="button"
              disabled={!consentChecked || loading}
              onClick={beginGuestTrial}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-5 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {loading ? "Starting…" : "Start talking"} <ArrowRight size={16} />
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => { setConsentPending(null); setConsentChecked(false); setError(""); }}
              className="mt-2 w-full rounded-2xl px-5 py-2.5 text-center text-sm font-semibold text-secondary-token disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
