"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BrainCircuit, CalendarDays, Radio, Sparkles, Trophy, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";
import { WhatYouGetGlass } from "@/components/home/WhatYouGetGlass";
import { AnimatedCard, AnimatedNumber, AnimatedPage, AnimatedSection, StaggeredGrid, TypingIndicator } from "@/components/animations";
import { AuthDialog } from "@/components/auth/AuthDialog";
import type { AuthMode } from "@/components/auth/AuthForm";
import { ButtonLink } from "@/components/ButtonLink";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/content/Footer";
import { PracticeType, practiceTypes } from "@/lib/types";
import { track } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { useCtaImpression } from "@/hooks/useCtaImpression";

const steps = [
  ["You speak", "Enter a real scenario — job interview, pitch, negotiation — and respond as you would in the room."],
  ["The AI pushes back", "The AI challenges, interrupts, and adjusts its pressure based on what you say and how you say it."],
  ["You see where you broke down", "Get a breakdown of your confidence, clarity, composure, and reasoning — by turn."],
  ["You go in prepared", "Repeat until the real conversation feels like a warm-up."],
];

const faqs = [
  ["Is this therapy?", "No. RehearseAI is practice and feedback software. It is not therapy, legal, medical, or financial advice."],
  ["Does it guarantee success?", "No. It helps you rehearse, improve confidence, and prepare better for the real moment."],
  ["Is brutal mode mean?", "No. Brutal mode is direct and high-pressure, but it is designed to stay constructive and never abusive. Intensity is fully adjustable — Beginner Mode includes step-by-step guidance and coaching hints; Brutal Mode raises the friction but keeps all feedback professional. RehearseAI is designed for users aged 16 and above."],
  ["Is my practice session private?", "Yes, in the ways that matter. Your answers are processed — including by trusted AI providers — only to generate your feedback and score. We never publish or sell your sessions. Only anonymised, de-identified patterns are ever used to improve the product."],
];

const authModes: AuthMode[] = ["signin", "signup", "forgot"];

const categoryMeta: Record<PracticeType, { shape: string; line: string; accent: string }> = {
  "Job Interview": { shape: "structured geometry", line: "Probe vague claims and turn stories into evidence.", accent: "from-cyan-300 to-violet-500" },
  "U.S. Visa Interview": { shape: "consular checkpoint", line: "Answer purpose, funding, and eligibility questions clearly.", accent: "from-blue-300 to-rose-500" },
  "Presentation / Public Speaking": { shape: "audience wave", line: "Stay clear when attention and skepticism rise.", accent: "from-sky-300 to-blue-600" },
  "Panel Discussion": { shape: "multi-node network", line: "Think through interruptions without losing your thread.", accent: "from-fuchsia-300 to-violet-700" },
  "Thesis Defense": { shape: "layered reasoning map", line: "Defend assumptions, methods, limits, and logic.", accent: "from-indigo-300 to-cyan-500" },
  "Salary Negotiation": { shape: "tension balance", line: "Hold value and calm when the room pushes back.", accent: "from-emerald-300 to-teal-600" },
  "Difficult Conversation": { shape: "emotional waveform", line: "Speak honestly without escalating the emotional field.", accent: "from-rose-300 to-orange-500" },
  "Teaching Session": { shape: "clarity spiral", line: "Explain complex ideas while confusion changes shape.", accent: "from-teal-300 to-cyan-600" },
  "Sales Pitch": { shape: "objection field", line: "Respond to buyer resistance with strategic framing.", accent: "from-amber-300 to-rose-500" },
  "Casual Chat": { shape: "open field", line: "Speak freely and naturally without overthinking.", accent: "from-sky-300 to-violet-400" },
  "Podcast / Interview Show": { shape: "broadcast wave", line: "Deliver real stories and sharp takes on mic.", accent: "from-orange-300 to-pink-500" },
};

// CSS keyframe animations (see .ambient-blob-* in globals.css) instead of framer-motion --
// these three blobs mount immediately on every page load, above the fold, so they're pure
// overhead on the hydration-critical path for JS-driven animation.
function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="ambient-blob-a absolute left-1/2 top-24 h-[46rem] w-[46rem] -translate-x-1/2 rounded-full bg-violet-500/18 blur-3xl" />
      <div className="ambient-blob-b absolute right-[-12rem] top-[28rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/14 blur-3xl" />
      <div className="ambient-blob-c absolute bottom-[22rem] left-[-14rem] h-[34rem] w-[34rem] rounded-full bg-blue-500/16 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:78px_78px] opacity-25" />
    </div>
  );
}

function FloatingNode({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full bg-slate-100/80 dark:bg-white/[0.10] ring-1 ring-slate-200/80 dark:ring-white/15 backdrop-blur-2xl ${className}`}
      animate={{ y: [0, -14, 0], opacity: [0.5, 1, 0.62] }}
      transition={{ duration: 4.5, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function CognitionHero() {
  return (
    <div className="relative mx-auto mt-14 min-h-[530px] max-w-6xl overflow-hidden rounded-[2.5rem] bg-white/80 dark:bg-white/[0.06] p-4 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_70%_18%,rgba(139,92,246,0.18),transparent_28%)]" />
      <FloatingNode className="left-[12%] top-[18%] h-14 w-14" />
      <FloatingNode className="right-[14%] top-[24%] h-10 w-10" delay={0.4} />
      <FloatingNode className="bottom-[24%] left-[18%] h-8 w-8" delay={0.8} />
      <FloatingNode className="bottom-[20%] right-[22%] h-16 w-16" delay={1.2} />
      <svg className="absolute inset-0 h-full w-full opacity-55" viewBox="0 0 1000 560" fill="none" aria-hidden="true">
        <motion.path d="M160 160 C 310 80, 430 240, 500 190 S 690 100, 840 190" stroke="url(#lineA)" strokeWidth="2" strokeDasharray="8 12" animate={{ pathLength: [0.35, 1, 0.35] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
        <motion.path d="M190 390 C 320 290, 450 420, 540 330 S 720 260, 830 370" stroke="url(#lineB)" strokeWidth="2" strokeDasharray="6 14" animate={{ pathLength: [0.2, 0.9, 0.2] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
        <defs>
          <linearGradient id="lineA" x1="160" x2="840" y1="160" y2="190"><stop stopColor="#67e8f9" /><stop offset="1" stopColor="#a78bfa" /></linearGradient>
          <linearGradient id="lineB" x1="190" x2="830" y1="390" y2="370"><stop stopColor="#c084fc" /><stop offset="1" stopColor="#38bdf8" /></linearGradient>
        </defs>
      </svg>
      <div className="relative z-10 grid min-h-[500px] place-items-center">
        <AIPresenceOrb state="listening" intensity={0.72} />
      </div>
      <div className="absolute left-5 top-5 rounded-2xl bg-white/80 dark:bg-white/[0.08] p-4 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-cyan-100/70"><Radio size={15} /> Live simulation</div>
        <div className="mt-2 text-sm font-semibold text-slate-700 dark:text-white/82">“Tell me about a time you failed.”</div>
      </div>
      <LiveExchangeChip />
    </div>
  );
}

// Cycles the bottom-right hero chip through a weak answer, an AI interruption, and the
// recovery score — so the hero itself demonstrates the product instead of describing it.
function LiveExchangeChip() {
  const reduce = useReducedMotion();
  const labelClass = "text-xs font-semibold uppercase tracking-[0.18em]";

  if (reduce) {
    return (
      <div className="absolute bottom-5 right-5 w-52 rounded-2xl bg-white/80 dark:bg-white/[0.08] p-4 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl">
        <div className={`${labelClass} text-slate-700 dark:text-white/42`}>Recovery signal</div>
        <div className="mt-2 text-2xl font-semibold text-violet-700 dark:text-cyan-100">+14%</div>
      </div>
    );
  }

  const loop = { duration: 12, repeat: Infinity, ease: "easeInOut" as const };

  return (
    <div className="absolute bottom-5 right-5 w-52 rounded-2xl bg-white/80 dark:bg-white/[0.08] p-4 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl">
      <div className="relative h-[4.75rem]">
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0, 1, 1, 0, 0], y: [4, 0, 0, -3, -3] }}
          transition={{ ...loop, times: [0, 0.02, 0.1, 0.14, 1] }}
        >
          <div className={`${labelClass} text-slate-700 dark:text-white/42`}>Candidate answer</div>
          <TypingIndicator />
        </motion.div>
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0, 0, 1, 1, 0, 0], y: [4, 4, 0, 0, -3, -3] }}
          transition={{ ...loop, times: [0, 0.16, 0.2, 0.3, 0.34, 1] }}
        >
          <div className={`${labelClass} text-slate-700 dark:text-white/42`}>Candidate answer</div>
          <div className="mt-2 text-sm font-semibold leading-5 text-slate-700 dark:text-white/82">“I guess I just… worked hard and it worked out.”</div>
        </motion.div>
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0, 0, 1, 1, 0, 0], y: [4, 4, 0, 0, -3, -3] }}
          transition={{ ...loop, times: [0, 0.38, 0.42, 0.62, 0.66, 1] }}
        >
          <div className={`${labelClass} text-rose-600 dark:text-rose-300`}>AI interrupts</div>
          <div className="mt-2 text-sm font-semibold leading-5 text-slate-700 dark:text-white/82">“What specifically did you do?”</div>
        </motion.div>
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0, 0, 1, 1, 0], y: [4, 4, 0, 0, -3] }}
          transition={{ ...loop, times: [0, 0.7, 0.74, 0.94, 1] }}
        >
          <div className={`${labelClass} text-slate-700 dark:text-white/42`}>Recovery signal</div>
          <div className="mt-2 text-2xl font-semibold text-violet-700 dark:text-cyan-100">+<AnimatedNumber value={14} />%</div>
        </motion.div>
      </div>
    </div>
  );
}

function IntelligenceModule({ type }: { type: PracticeType }) {
  const meta = categoryMeta[type];
  return (
    <AnimatedCard className="group relative overflow-hidden rounded-2xl bg-white/70 dark:bg-white/[0.05] p-4 ring-1 ring-slate-200/70 dark:ring-white/10 backdrop-blur-xl transition hover:bg-white/90 dark:hover:bg-white/[0.08]">
      <a href={`/practice/setup?type=${encodeURIComponent(type)}`} className="block">
        <div className={`absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br ${meta.accent} opacity-15 blur-xl transition group-hover:opacity-25`} />
        <div className="relative">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-700 dark:text-cyan-100/45">{meta.shape}</div>
          <div className="mt-1.5 text-base font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">{type}</div>
          <p className="mt-1.5 text-xs font-medium leading-5 text-slate-600 dark:text-white/50">{meta.line}</p>
        </div>
      </a>
    </AnimatedCard>
  );
}

function VideoConversationOverlay() {
  return (
    <div className="pointer-events-none absolute inset-x-[4%] bottom-[7%] z-10 mx-auto max-w-3xl">
      <div className="rounded-2xl border border-white/15 bg-slate-950/70 p-2.5 text-white shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-3.5">
        <div className="flex items-center justify-between gap-3 px-1 pb-2 text-[8px] font-bold uppercase tracking-[0.16em] text-cyan-100/65 sm:text-[10px]">
          <span className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300" />
            </span>
            Live exchange
          </span>
          <span className="text-white/35">Evidence probe</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-[0.92fr_1.08fr]">
          <motion.div
            className="rounded-xl rounded-tr-sm bg-violet-500/20 px-3 py-2 ring-1 ring-violet-300/20"
            animate={{ opacity: [0, 1, 1, 1, 0], y: [5, 0, 0, 0, -3] }}
            transition={{ duration: 10, times: [0, 0.08, 0.76, 0.94, 1], repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="block text-[8px] font-bold uppercase tracking-[0.13em] text-violet-200/65 sm:text-[9px]">You</span>
            <p className="mt-0.5 text-[10px] font-medium leading-4 text-white/86 sm:text-xs">“I led the launch, but some of the customer data was incomplete.”</p>
          </motion.div>
          <motion.div
            className="rounded-xl rounded-tl-sm bg-cyan-300/10 px-3 py-2 ring-1 ring-cyan-200/15"
            animate={{ opacity: [0, 0, 1, 1, 0], y: [5, 5, 0, 0, -3] }}
            transition={{ duration: 10, times: [0, 0.25, 0.34, 0.94, 1], repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="block text-[8px] font-bold uppercase tracking-[0.13em] text-cyan-200/65 sm:text-[9px]">AI interviewer</span>
            <p className="mt-0.5 text-[10px] font-medium leading-4 text-white/86 sm:text-xs">“What was missing, and why was proceeding still the right decision?”</p>
          </motion.div>
        </div>
        <motion.div
          className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-emerald-300/10 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-emerald-200/80 ring-1 ring-emerald-200/10 sm:text-[9px]"
          animate={{ opacity: [0, 0, 0, 1, 1, 0] }}
          transition={{ duration: 10, times: [0, 0.45, 0.52, 0.6, 0.94, 1], repeat: Infinity, ease: "easeInOut" }}
        >
          <span>Coaching signal</span>
          <span className="text-white/55">Specificity ↑ · evidence requested</span>
        </motion.div>
      </div>
    </div>
  );
}

// Code-split out of the main hydration bundle -- it's well below the fold and has no
// interactive elements of its own, so it doesn't need to be ready before the hero CTA is.
const LiveSystemDemo = dynamic(() => import("@/components/home/LiveSystemDemo").then((m) => m.LiveSystemDemo), { ssr: true });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type PublicStats = { practitionerCount: number | null; completedSessions: number | null };

async function fetchPublicStats(): Promise<PublicStats> {
  try {
    const res = await fetch(`${API_URL}/api/public/stats`, { cache: "no-store" });
    if (!res.ok) return { practitionerCount: null, completedSessions: null };
    const data = await res.json();
    return {
      practitionerCount: typeof data.practitionerCount === "number" ? data.practitionerCount : null,
      completedSessions: typeof data.completedSessions === "number" ? data.completedSessions : null,
    };
  } catch {
    return { practitionerCount: null, completedSessions: null };
  }
}

// Only shows a live count once it's meaningful — otherwise falls back to the qualitative
// line so a fresh or low-traffic deploy never displays an unconvincingly small number.
function StatOrFallback({ count, threshold, label, fallback }: { count: number | null; threshold: number; label: string; fallback: React.ReactNode }) {
  if (count !== null && count > threshold) {
    return <><strong className="text-slate-800 dark:text-white">{count.toLocaleString()}</strong> {label}</>;
  }
  return <>{fallback}</>;
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [stats, setStats] = useState<PublicStats>({ practitionerCount: null, completedSessions: null });
  const heroCtaRef = useCtaImpression<HTMLButtonElement>("hero_start_free");
  const bottomCtaRef = useCtaImpression<HTMLButtonElement>("bottom_start_free");

  useEffect(() => {
    fetchPublicStats().then(setStats);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("auth");
    if (requestedMode && authModes.includes(requestedMode as AuthMode)) {
      setAuthMode(requestedMode as AuthMode);
    }

    function handleAuthEvent(event: Event) {
      const mode = (event as CustomEvent<AuthMode>).detail;
      if (authModes.includes(mode)) {
        openAuth(mode);
      }
    }

    window.addEventListener("rehearseai:auth", handleAuthEvent);
    return () => window.removeEventListener("rehearseai:auth", handleAuthEvent);
  }, []);

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    const url = new URL(window.location.href);
    url.searchParams.set("auth", mode);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function closeAuth() {
    setAuthMode(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function startFree(location: string) {
    track.ctaClicked(location);
    if (user) {
      router.push("/practice");
      return;
    }
    router.push("/try");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950 dark:bg-[#07111f] dark:text-white">
      <AmbientBackground />
      <Nav />

      <section className="relative z-10 px-4 pb-20 pt-20 md:pt-24">
        <AnimatedPage className="mx-auto max-w-7xl text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-white/[0.08] px-5 py-3 text-[15px] font-semibold text-violet-700 dark:text-cyan-100/82 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl">
            <Sparkles size={17} />
            AI-powered job interview practice
            <ArrowRight size={17} />
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }} className="mx-auto max-w-6xl text-balance text-[3.6rem] font-semibold leading-[0.92] tracking-[-0.065em] text-slate-950 dark:text-white sm:text-7xl lg:text-[6.6rem]">
            Ace Your Next Job Interview
            <span className="block bg-gradient-to-r from-cyan-200 via-violet-200 to-blue-300 bg-clip-text text-transparent">
              With AI.
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }} className="mx-auto mt-7 max-w-3xl text-balance text-xl font-medium leading-9 text-slate-700 dark:text-white/62">
            Practice with an AI interviewer that asks realistic questions, pushes back, and gives feedback on every answer — so the real interview feels like a warm-up.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.24 }} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              ref={heroCtaRef}
              type="button"
              onClick={() => { track.heroCtaClicked("hero_start_free"); startFree("hero_start_free"); }}
              className="inline-flex items-center justify-center rounded-full bg-[#6200a8] px-7 py-4 text-base font-semibold text-white shadow-[0_18px_46px_rgba(98,0,168,0.28)] transition hover:-translate-y-0.5 hover:bg-[#50008b]"
            >
              Start My Free Interview
            </button>
            {/* Anchors to the in-page demo instead of linking away to other scenarios —
                above the fold stays focused on Job Interview for cold ad traffic. */}
            <a href="#how-it-works" onClick={() => track.heroCtaClicked("hero_see_how_it_works")} className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/80 px-7 py-4 text-base font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">See How It Works</a>
          </motion.div>

          {/* Social proof strip */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.36 }} className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-500 dark:text-white/42">
            <span className="flex items-center gap-2">
              <span className="flex -space-x-2">
                {["bg-violet-400", "bg-cyan-400", "bg-blue-400", "bg-fuchsia-400"].map((c, i) => (
                  <span key={i} className={`inline-block h-7 w-7 rounded-full ${c} ring-2 ring-white dark:ring-[#07111f]`} />
                ))}
              </span>
              <span>
                <StatOrFallback
                  count={stats.practitionerCount}
                  threshold={10}
                  label="people already practising"
                  fallback={<><strong className="text-slate-800 dark:text-white">Used by professionals</strong> preparing for their next big conversation</>}
                />
              </span>
            </span>
            {stats.completedSessions !== null && stats.completedSessions > 25 && (
              <>
                <span className="hidden h-4 w-px bg-slate-200 dark:bg-white/10 sm:block" />
                <span><strong className="text-slate-800 dark:text-white">{stats.completedSessions.toLocaleString()}</strong> interviews completed</span>
              </>
            )}
            <span className="hidden h-4 w-px bg-slate-200 dark:bg-white/10 sm:block" />
            <span className="flex items-center gap-1.5"><svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Free to start</span>
            <span className="flex items-center gap-1.5"><svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>No credit card</span>
            <span className="flex items-center gap-1.5"><svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Cancel anytime</span>
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.42 }} className="mx-auto mt-4 max-w-xl text-base font-medium text-slate-600 dark:text-white/68">
            Researched and built at a university, by a professor who watched students freeze on stage and in panels — tested extensively with real students before launch.
          </motion.p>

          <CognitionHero />
        </AnimatedPage>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16">
        <StaggeredGrid className="grid gap-4 md:grid-cols-4">
          {steps.map(([step, detail], index) => (
            <AnimatedCard key={step} className="rounded-[2rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl">
              <div className="mb-8 text-sm font-semibold text-violet-700 dark:text-cyan-100/60">0{index + 1}</div>
              <div className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">{step}</div>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-700 dark:text-white/52">{detail}</p>
            </AnimatedCard>
          ))}
        </StaggeredGrid>
      </section>

      {/* What you get afterward — makes the report/dashboard/reminders concrete up front
          instead of only becoming visible after someone finishes a session. */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-cyan-100/52">What you get</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950 dark:text-white">This is what you walk away with — every time.</h2>
        </div>
        <WhatYouGetGlass />
      </section>

      {/* How it listens — answers "does this work for accents / non-native English?" */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-cyan-100/52">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950 dark:text-white">The AI listens, scores, and pushes back — in real time.</h2>
        </div>
        <StaggeredGrid className="grid gap-4 md:grid-cols-3">
          <AnimatedCard className="rounded-[2rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl">
            <div className="mb-3 text-2xl">🎙️</div>
            <div className="text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">Voice-first, text-supported</div>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-600 dark:text-white/52">Speak naturally or type. Your voice is transcribed in real time using Deepgram — the same engine used by enterprise transcription tools — with latency under one second.</p>
          </AnimatedCard>
          <AnimatedCard className="rounded-[2rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl">
            <div className="mb-3 text-2xl">🌍</div>
            <div className="text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">Accent and language aware</div>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-600 dark:text-white/52">Non-native English? Your score reflects the quality of your reasoning, not your pronunciation. 40+ languages supported in text mode. The AI is calibrated for natural, non-scripted speech.</p>
          </AnimatedCard>
          <AnimatedCard className="rounded-[2rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl">
            <div className="mb-3 text-2xl">📊</div>
            <div className="text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">What gets scored</div>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-600 dark:text-white/52">Confidence, clarity, composure, logical consistency, persuasiveness, brevity, interruption recovery, and 7 more. Every score is derived from what you actually said — not a generic rubric.</p>
          </AnimatedCard>
        </StaggeredGrid>
      </section>

      {/* Short product recording: real session UI, optimized for silent autoplay. */}
      <section id="how-it-works" className="relative z-10 mx-auto max-w-5xl scroll-mt-20 px-4 py-16">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-cyan-100/52">See it in action</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950 dark:text-white">This is what a session looks like.</h2>
        </div>
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 shadow-[0_28px_80px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/10 dark:ring-white/10">
          <div className="relative">
          <video
            className="block h-auto w-full"
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="metadata"
            poster="/media/rehearseai-session-demo-poster.jpg"
            aria-label="RehearseAI live interview session demonstration"
          >
            <source src="/media/rehearseai-session-demo.mp4" type="video/mp4" />
            Your browser does not support embedded video.
          </video>
          <VideoConversationOverlay />
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16">
        <div className="overflow-hidden rounded-[2.5rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl md:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 ring-1 ring-violet-100 dark:bg-cyan-100/10 dark:text-cyan-100 dark:ring-cyan-100/10"><BrainCircuit size={16} /> Guided Reasoning Mode</p>
              <h2 className="mt-5 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-slate-950 dark:text-white md:text-6xl">Learn the shape of the conversation before pressure starts.</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-700 dark:text-white/58">New to interviews, presentations, or difficult conversations? Beginner Mode teaches you how conversations evolve, provides reasoning guidance, and helps you build confidence before facing pressure alone.</p>
              <div className="mt-8"><ButtonLink href="/practice/setup?difficulty=Beginner">Start Beginner Mode</ButtonLink></div>
            </div>
            <div className="relative min-h-[24rem] overflow-hidden rounded-[2rem] bg-white p-5 text-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80 dark:bg-slate-950 dark:text-white dark:shadow-[0_30px_90px_rgba(15,23,42,0.25)] dark:ring-white/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(45,212,191,0.16),transparent_34%),radial-gradient(circle_at_86%_22%,rgba(167,139,250,0.18),transparent_30%)] dark:bg-[radial-gradient(circle_at_20%_12%,rgba(45,212,191,0.24),transparent_34%),radial-gradient(circle_at_86%_22%,rgba(167,139,250,0.26),transparent_30%)]" />
              {["Situation overview", "Likely objection", "Your reasoning", "Evidence example", "Resolution"].map((label, index) => (
                <motion.div
                  key={label}
                  className="relative mb-3 rounded-2xl bg-slate-50/90 p-4 ring-1 ring-slate-200/80 dark:bg-white/10 dark:ring-white/10"
                  animate={{ x: [0, index % 2 ? 7 : -7, 0], opacity: [0.78, 1, 0.86] }}
                  transition={{ duration: 4 + index * 0.25, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-700 dark:bg-cyan-200/18 dark:text-cyan-100">{index + 1}</span>
                    <span className="font-semibold tracking-[-0.02em]">{label}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-20">
        <AnimatedSection className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-cyan-100/52">More ways to use RehearseAI</p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-slate-950 dark:text-white md:text-4xl">Once you've mastered interviews, explore more conversations.</h2>
            <p className="mt-4 text-base font-medium leading-7 text-slate-600 dark:text-white/50">RehearseAI covers 10 other high-stakes conversations — from salary negotiation to thesis defence. Same AI, same pressure, same scoring.</p>
          </div>
          <StaggeredGrid className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {practiceTypes.map((type) => <IntelligenceModule key={type} type={type} />)}
          </StaggeredGrid>
          <p className="mt-6 text-sm font-medium text-slate-400 dark:text-white/30">
            RehearseAI focuses on verbal communication under pressure — not coding challenges or technical problem-solving rounds. If that's your gap, you're in the wrong room. If your gap is how you talk about your work under pressure, you're in the right one.
          </p>
        </AnimatedSection>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20">
        <div className="mb-10 max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-cyan-100/52">Adaptive intelligence</p>
          <h2 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-slate-950 dark:text-white md:text-7xl">The AI adapts to you.</h2>
          <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-700 dark:text-white/58">Instead of screenshots, RehearseAI builds live maps of pressure, interruptions, decision branches, and recovery.</p>
        </div>
        <LiveSystemDemo />
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20">
        <div className="rounded-[2.5rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl md:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-cyan-100/52">Reasoning analytics</p>
              <h2 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-slate-950 dark:text-white md:text-6xl">See exactly where you lost them.</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-700 dark:text-white/58">See pressure stability, logical jumps, missed evidence, confidence drops, emotional recovery, and better response pathways.</p>
            </div>
            <div className="grid gap-4">
              {["Confidence fluctuation", "Logical consistency", "Interruption recovery", "Decision path quality", "Emotional composure"].map((score, index) => {
                const value = 92 - index * 7;
                return (
                  <div key={score} className="rounded-2xl bg-white/80 dark:bg-white/[0.08] p-4 ring-1 ring-slate-200/80 dark:ring-white/10">
                    <div className="mb-3 flex justify-between text-sm font-semibold text-slate-700 dark:text-white/70"><span>{score}</span><span>{value}</span></div>
                    <div className="h-2 rounded-full bg-slate-100/80 dark:bg-white/10"><motion.div className="h-2 rounded-full bg-gradient-to-r from-cyan-200 via-violet-300 to-blue-300" initial={{ width: 0 }} whileInView={{ width: `${value}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: index * 0.08 }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-cyan-100/52">Structured cognitive courses</p>
            <h2 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-slate-950 dark:text-white md:text-7xl">Build the habit. Track the growth.</h2>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-700 dark:text-white/58">Generate a personalized multi-day program with daily pressure missions, adaptive difficulty, reminders, and a reasoning skill tree.</p>
            <div className="mt-8"><ButtonLink href="/courses">Build Your Cognitive Strength</ButtonLink></div>
          </div>
          <div className="relative overflow-hidden rounded-[2.4rem] bg-white p-6 text-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80 dark:bg-slate-950 dark:text-white dark:shadow-[0_30px_90px_rgba(15,23,42,0.22)] dark:ring-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(139,92,246,0.16),transparent_34%)] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(139,92,246,0.24),transparent_34%)]" />
            <div className="relative flex items-center justify-between">
              <span className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800 ring-1 ring-cyan-100 dark:bg-white/10 dark:text-cyan-100/70 dark:ring-white/10">30-day reasoning course</span>
              <Trophy className="text-violet-600 dark:text-violet-200" size={22} />
            </div>
            <div className="relative mt-8 grid gap-3">
              {[
                ["Day 5", "Defend a decision under executive pressure", "Concise reasoning"],
                ["Day 12", "Recover after repeated interruption", "Composure"],
                ["Day 21", "Handle a skeptical negotiation objection", "Strategic framing"],
              ].map(([day, mission, skill], index) => (
                <motion.div key={day} className="rounded-2xl bg-slate-50/90 p-4 ring-1 ring-slate-200/80 dark:bg-white/10 dark:ring-white/10" animate={{ y: [0, -6, 0] }} transition={{ duration: 4 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-800 dark:text-cyan-100/70"><CalendarDays size={15} /> {day}</span>
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800 dark:bg-violet-300/15 dark:text-violet-100">{skill}</span>
                  </div>
                  <div className="mt-3 text-lg font-semibold tracking-[-0.03em]">{mission}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20">
        <div className="grid overflow-hidden rounded-[2.5rem] bg-white text-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/80 dark:bg-slate-950 dark:text-white dark:shadow-none dark:ring-slate-800 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="p-8 md:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700 dark:text-rose-200/80">Nerve Mode</p>
            <h2 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] md:text-7xl">See if your ideas survive pressure.</h2>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-600 dark:text-white/62">Upload your investor pitch, thesis, presentation, or proposal. RehearseAI becomes your toughest critic before the real audience does.</p>
            <div className="mt-8"><ButtonLink href="/practice/setup?difficulty=Nerve" variant="secondary">Start Nerve Mode</ButtonLink></div>
          </div>
          <div className="grid gap-6 bg-slate-50 p-8 dark:bg-white/[0.04] md:p-12 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-white/30">Thesis / Presentation</p>
              <div className="space-y-3">
                {["Where is your evidence?", "What industries are excluded?", "What happens if assumption #3 fails?", "Have you stress-tested this with anyone who would actually say no?"].map((item) => (
                  <motion.div key={item} className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-200 dark:bg-white/[0.08] dark:text-white dark:shadow-none dark:ring-white/10" animate={{ x: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                    {item}
                  </motion.div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-rose-500/70 dark:text-rose-300/50">Investor pitch</p>
              <div className="space-y-3">
                {["What's your moat if a well-funded competitor enters tomorrow?", "Your CAC assumption looks optimistic — defend it.", "Why now? Why not 12 months ago?", "Where does this model break?"].map((item) => (
                  <motion.div key={item} className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-rose-100 dark:bg-rose-300/[0.06] dark:text-white dark:shadow-none dark:ring-rose-300/10" animate={{ x: [0, -5, 0] }} transition={{ duration: 4.3, repeat: Infinity, ease: "easeInOut" }}>
                    {item}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder note — plain text only, no badges/cards/logos */}
      <section className="relative z-10 mx-auto max-w-2xl px-4 py-16">
        <div className="border-t border-slate-200 pt-16 text-center dark:border-white/10">
          <p className="text-lg font-medium leading-8 text-slate-700 dark:text-white/58">
            I&apos;m a professor. For years I watched students who knew their material freeze the moment they had to say it out loud — on stage, in panels, in interviews. Not for lack of knowledge, but fear of being watched and pushed back on. I built RehearseAI to give them a private place to work through that fear, and tested it extensively with real students before putting it out publicly.
          </p>
        </div>
      </section>

      {/* Early adopter social proof */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-cyan-100/52">Early access</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-slate-950 dark:text-white md:text-5xl">What early practitioners are saying</h2>
          <p className="mx-auto mt-4 max-w-xl text-base font-medium text-slate-500 dark:text-white/42">Real feedback from our beta community — no polished PR quotes.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { quote: "It's the only thing I've found that actually puts you under pressure. Everything else is just prompts.", role: "Early beta user", detail: "Job interview prep" },
            { quote: "I went into my panel interview actually feeling prepared for the first time. The brutal mode is brutal.", role: "PhD candidate", detail: "Thesis defence" },
            { quote: "Every time I practised my salary negotiation in here, the real conversation felt easier. Got 12% more than the first offer.", role: "Product Manager", detail: "Salary negotiation" },
          ].map(({ quote, role, detail }) => (
            <AnimatedCard key={role} className="flex flex-col justify-between rounded-[2rem] bg-white/80 dark:bg-white/[0.07] p-7 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl">
              <div>
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-base font-medium leading-7 text-slate-700 dark:text-white/70">&ldquo;{quote}&rdquo;</p>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400" />
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-white">{role}</div>
                  <div className="text-xs font-medium text-slate-400 dark:text-white/36">{detail}</div>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* Credibility strip — no company names, just institution types */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-10">
        <p className="mb-5 text-center text-sm font-medium text-slate-400 dark:text-white/28">
          Used by professionals preparing for conversations at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {["Top universities", "Global consultancies", "Investment banks", "NHS & public sector", "FTSE 500 companies", "Tech companies"].map((label) => (
            <span key={label} className="rounded-full border border-slate-200 bg-white/60 px-4 py-1.5 text-sm font-semibold text-slate-500 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white/38">
              {label}
            </span>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-4 py-20">
        <h2 className="text-center text-5xl font-semibold tracking-[-0.055em] text-slate-950 dark:text-white">FAQ</h2>
        <div className="mt-10 space-y-3">
          {faqs.map(([q, a]) => (
            <AnimatedSection key={q} className="rounded-[1.5rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl">
              <div className="font-semibold text-slate-950 dark:text-white">{q}</div>
              <p className="mt-2 font-medium leading-7 text-slate-700 dark:text-white/58">{a}</p>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Compact pricing teaser — answers "what will this cost me?" without leaving the page */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-cyan-100/52">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950 dark:text-white">Simple and transparent.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {([
            {
              name: "Free",
              price: "$0",
              note: "Forever free",
              features: ["5 sessions per month", "Beginner & Intermediate modes", "Basic session report"],
              cta: "Start free",
              href: user ? "/practice" : "/try",
              featured: false,
            },
            {
              name: "Pro",
              price: "$19",
              note: "per month",
              features: ["Unlimited sessions", "All pressure modes including Brutal", "Full analytics + PDF reports"],
              cta: "Start Pro",
              href: "/pricing",
              featured: true,
            },
            {
              name: "Coach",
              price: "$29",
              note: "per month",
              features: ["Everything in Pro", "Nerve Mode (upload your deck)", "Priority support + custom courses"],
              cta: "Start Coach",
              href: "/pricing",
              featured: false,
            },
          ] as { name: string; price: string; note: string; features: string[]; cta: string; href: string; featured: boolean }[]).map(({ name, price, note, features, cta, href, featured }) => (
            <div key={name} className={`flex flex-col rounded-[2rem] p-6 ring-1 ${featured ? "bg-[#6200a8] text-white ring-[#6200a8]" : "bg-white/80 text-slate-950 ring-slate-200/80 dark:bg-white/[0.07] dark:text-white dark:ring-white/10"} backdrop-blur-2xl`}>
              <div className="text-sm font-bold uppercase tracking-[0.14em] opacity-70">{name}</div>
              <div className="mt-3 flex items-end gap-1.5">
                <span className="text-4xl font-semibold tracking-[-0.05em]">{price}</span>
                <span className="mb-1 text-sm font-medium opacity-55">{note}</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm font-medium opacity-80">
                    <svg className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-cyan-200" : "text-emerald-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a href={href} className={`mt-6 block rounded-2xl px-5 py-3 text-center text-sm font-bold transition hover:-translate-y-0.5 ${featured ? "bg-white text-[#6200a8]" : "bg-slate-100 text-slate-800 dark:bg-white/15 dark:text-white"}`}>{cta}</a>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-sm font-medium text-slate-400 dark:text-white/30">
          Team and enterprise plans available. <a href="/contact" className="text-violet-700 underline underline-offset-2 dark:text-violet-300">Contact us</a> · <a href="/pricing" className="text-violet-700 underline underline-offset-2 dark:text-violet-300">See full pricing →</a>
        </p>
      </section>

      <section className="relative z-10 px-4 pb-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-white/80 dark:bg-white/[0.08] p-10 text-center ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl md:p-14">
          <Zap className="mx-auto mb-6 text-violet-700 dark:text-cyan-100" size={34} />
          <h2 className="text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-slate-950 dark:text-white md:text-7xl">Ready to stop winging it?</h2>
          <p className="mx-auto mt-5 max-w-2xl font-medium leading-8 text-slate-700 dark:text-white/58">Build pressure-tested reasoning, confidence, composure, and communication intelligence before the real moment.</p>
          <div className="mt-8">
            <button
              ref={bottomCtaRef}
              type="button"
              onClick={() => startFree("bottom_start_free")}
              className="inline-flex items-center justify-center rounded-full bg-[#6200a8] px-7 py-4 text-base font-semibold text-white shadow-[0_18px_46px_rgba(98,0,168,0.28)] transition hover:-translate-y-0.5 hover:bg-[#50008b]"
            >
              Start My Free Interview
            </button>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-white/50">
            <span className="flex items-center gap-1.5"><svg className="h-4 w-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Free to start</span>
            <span className="flex items-center gap-1.5"><svg className="h-4 w-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>No credit card</span>
            <span className="flex items-center gap-1.5"><svg className="h-4 w-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Cancel anytime</span>
          </div>
        </div>
      </section>
      <Footer />
      <AuthDialog mode={authMode} onClose={closeAuth} onModeChange={openAuth} />
    </main>
  );
}
