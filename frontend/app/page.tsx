"use client";

import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, CalendarDays, GitBranch, Radio, Sparkles, Trophy, Waves, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";
import { AnimatedCard, AnimatedPage, AnimatedSection, StaggeredGrid } from "@/components/animations";
import { AuthDialog } from "@/components/auth/AuthDialog";
import type { AuthMode } from "@/components/auth/AuthForm";
import { ButtonLink } from "@/components/ButtonLink";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/content/Footer";
import { PracticeType, practiceTypes } from "@/lib/types";

const steps = [
  ["Cognitive immersion", "Enter a scenario that behaves like pressure, not a prompt box."],
  ["Adaptive intelligence", "The persona shifts tone, depth, and friction as your answers change."],
  ["Reasoning analytics", "Map confidence, composure, logic, recovery, and decision paths."],
  ["Transformation", "Return with a sharper mental model for the real room."],
];

const faqs = [
  ["Is this therapy?", "No. RehearseAI is practice and feedback software. It is not therapy, legal, medical, or financial advice."],
  ["Does it guarantee success?", "No. It helps you rehearse, improve confidence, and prepare better for the real moment."],
  ["Is brutal mode mean?", "No. Brutal mode is direct and high-pressure, but it is designed to stay constructive and never abusive."],
];

const authModes: AuthMode[] = ["signin", "signup", "forgot"];

const categoryMeta: Record<PracticeType, { shape: string; line: string; accent: string }> = {
  "Job Interview": { shape: "structured geometry", line: "Probe vague claims and turn stories into evidence.", accent: "from-cyan-300 to-violet-500" },
  "Presentation / Public Speaking": { shape: "audience wave", line: "Stay clear when attention and skepticism rise.", accent: "from-sky-300 to-blue-600" },
  "Panel Discussion": { shape: "multi-node network", line: "Think through interruptions without losing your thread.", accent: "from-fuchsia-300 to-violet-700" },
  "Thesis Defense": { shape: "layered reasoning map", line: "Defend assumptions, methods, limits, and logic.", accent: "from-indigo-300 to-cyan-500" },
  "Salary Negotiation": { shape: "tension balance", line: "Hold value and calm when the room pushes back.", accent: "from-emerald-300 to-teal-600" },
  "Difficult Conversation": { shape: "emotional waveform", line: "Speak honestly without escalating the emotional field.", accent: "from-rose-300 to-orange-500" },
  "Teaching Session": { shape: "clarity spiral", line: "Explain complex ideas while confusion changes shape.", accent: "from-teal-300 to-cyan-600" },
  "Sales Pitch": { shape: "objection field", line: "Respond to buyer resistance with strategic framing.", accent: "from-amber-300 to-rose-500" },
  "Casual Chat": { shape: "open field", line: "Speak freely and naturally without overthinking.", accent: "from-sky-300 to-violet-400" },
};

function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute left-1/2 top-24 h-[46rem] w-[46rem] -translate-x-1/2 rounded-full bg-violet-500/18 blur-3xl"
        animate={{ scale: [0.96, 1.08, 0.98], opacity: [0.45, 0.76, 0.52] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-12rem] top-[28rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/14 blur-3xl"
        animate={{ x: [0, -38, 0], y: [0, 28, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[22rem] left-[-14rem] h-[34rem] w-[34rem] rounded-full bg-blue-500/16 blur-3xl"
        animate={{ x: [0, 36, 0], y: [0, -26, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
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
    <div className="relative mx-auto mt-14 min-h-[530px] max-w-6xl overflow-hidden rounded-[2.5rem] bg-white/80 dark:bg-white/[0.06] p-4 ring-1 ring-slate-200/80 dark:ring-white/12 backdrop-blur-2xl">
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
      <div className="absolute left-5 top-5 rounded-2xl bg-white/80 dark:bg-white/[0.08] p-4 ring-1 ring-slate-200/80 dark:ring-white/12 backdrop-blur-2xl">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-cyan-100/70"><Radio size={15} /> Live simulation</div>
        <div className="mt-2 text-sm font-semibold text-slate-700 dark:text-white/82">“What assumption are you making?”</div>
      </div>
      <div className="absolute bottom-5 right-5 rounded-2xl bg-white/80 dark:bg-white/[0.08] p-4 ring-1 ring-slate-200/80 dark:ring-white/12 backdrop-blur-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-white/42">Recovery signal</div>
        <div className="mt-2 text-2xl font-semibold text-violet-700 dark:text-cyan-100">+14%</div>
      </div>
    </div>
  );
}

function IntelligenceModule({ type }: { type: PracticeType }) {
  const meta = categoryMeta[type];
  return (
    <AnimatedCard className="group relative min-h-64 overflow-hidden rounded-[2rem] bg-white/80 dark:bg-white/[0.07] p-5 ring-1 ring-slate-200/80 dark:ring-white/12 backdrop-blur-2xl">
      <a href={`/practice/setup?type=${encodeURIComponent(type)}`} className="block h-full">
        <div className={`absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br ${meta.accent} opacity-20 blur-2xl transition group-hover:opacity-35`} />
        <div className="relative h-28">
          <div className="absolute left-2 top-8 h-14 w-14 rounded-full bg-white/80 dark:bg-white/[0.08] ring-1 ring-slate-200/80 dark:ring-white/15" />
          <motion.div
            className={`absolute left-12 top-4 h-20 w-20 rounded-full bg-gradient-to-br ${meta.accent} opacity-75 blur-sm`}
            animate={{ scale: [1, 1.12, 1], rotate: [0, 18, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute left-28 top-12 h-2 w-24 rounded-full bg-slate-300/70 dark:bg-white/20" />
          <div className="absolute left-36 top-20 h-2 w-14 rounded-full bg-cyan-200/40" />
        </div>
        <div className="relative">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-cyan-100/50">{meta.shape}</div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">{type}</div>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-700 dark:text-white/58">{meta.line}</p>
        </div>
      </a>
    </AnimatedCard>
  );
}

function LiveSystemDemo() {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <AnimatedSection className="rounded-[2rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/12 backdrop-blur-2xl">
        <div className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-cyan-100"><GitBranch size={18} /> Decision path expanding</div>
        <div className="relative mt-8 h-80">
          {["Main answer", "Evidence path", "Generic path", "Defensive path", "Executive version"].map((label, index) => (
            <motion.div
              key={label}
              className="absolute rounded-full bg-white/80 dark:bg-white/[0.09] px-4 py-2 text-sm font-semibold text-slate-700 dark:text-white/76 ring-1 ring-slate-200/80 dark:ring-white/12"
              style={{ left: `${index === 0 ? 42 : 10 + index * 18}%`, top: `${index === 0 ? 8 : 45 + (index % 2) * 22}%` }}
              animate={{ y: [0, -8, 0], opacity: [0.62, 1, 0.72] }}
              transition={{ duration: 3.6 + index * 0.25, repeat: Infinity, ease: "easeInOut" }}
            >
              {label}
            </motion.div>
          ))}
          <div className="absolute left-1/2 top-24 h-40 w-px bg-gradient-to-b from-cyan-200/50 to-transparent" />
          <div className="absolute inset-x-10 top-40 h-px bg-gradient-to-r from-transparent via-violet-200/45 to-transparent" />
        </div>
      </AnimatedSection>
      <AnimatedSection className="rounded-[2rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/12 backdrop-blur-2xl">
        <div className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-cyan-100"><Waves size={18} /> Pressure response field</div>
        <div className="mt-8 flex h-72 items-center gap-2">
          {Array.from({ length: 42 }).map((_, index) => (
            <motion.span
              key={index}
              className="w-full rounded-full bg-gradient-to-t from-violet-500 via-cyan-300 to-white"
              animate={{ height: [`${24 + ((index * 11) % 56)}%`, `${38 + ((index * 17) % 58)}%`, `${22 + ((index * 7) % 48)}%`] }}
              transition={{ duration: 2.6 + (index % 5) * 0.12, repeat: Infinity, ease: "easeInOut" }}
              style={{ opacity: 0.26 + (index % 6) * 0.09 }}
            />
          ))}
        </div>
      </AnimatedSection>
    </div>
  );
}

export default function Home() {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

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

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950 dark:bg-[#07111f] dark:text-white">
      <AmbientBackground />
      <Nav />

      <section className="relative z-10 px-4 pb-20 pt-20 md:pt-24">
        <AnimatedPage className="mx-auto max-w-7xl text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-white/[0.08] px-5 py-3 text-[15px] font-semibold text-violet-700 dark:text-cyan-100/82 ring-1 ring-slate-200/80 dark:ring-white/12 backdrop-blur-2xl">
            <Sparkles size={17} />
            Cognitive simulation platform
            <ArrowRight size={17} />
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }} className="mx-auto max-w-6xl text-balance text-[3.6rem] font-semibold leading-[0.92] tracking-[-0.065em] text-slate-950 dark:text-white sm:text-7xl lg:text-[6.6rem]">
            Train how you think.
            <span className="block bg-gradient-to-r from-cyan-200 via-violet-200 to-blue-300 bg-clip-text text-transparent">
              Under pressure.
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }} className="mx-auto mt-7 max-w-3xl text-balance text-xl font-medium leading-9 text-slate-700 dark:text-white/62">
            Rehearse high-stakes moments inside an adaptive AI environment that reads your reasoning, composure, pressure recovery, and communication strategy.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.24 }} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => openAuth("signup")}
              className="inline-flex items-center justify-center rounded-full bg-[#6200a8] px-7 py-4 text-base font-semibold text-white shadow-[0_18px_46px_rgba(98,0,168,0.28)] transition hover:-translate-y-0.5 hover:bg-[#50008b]"
            >
              Start Rehearsing Free
            </button>
            <ButtonLink href="/practice/setup?type=Panel%20Discussion&difficulty=Brutal" variant="secondary">Try Brutal Panel Mode</ButtonLink>
          </motion.div>

          <CognitionHero />
        </AnimatedPage>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16">
        <StaggeredGrid className="grid gap-4 md:grid-cols-4">
          {steps.map(([step, detail], index) => (
            <AnimatedCard key={step} className="rounded-[2rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/12 backdrop-blur-2xl">
              <div className="mb-8 text-sm font-semibold text-violet-700 dark:text-cyan-100/60">0{index + 1}</div>
              <div className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">{step}</div>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-700 dark:text-white/52">{detail}</p>
            </AnimatedCard>
          ))}
        </StaggeredGrid>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16">
        <div className="overflow-hidden rounded-[2.5rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/12 backdrop-blur-2xl md:p-10">
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
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-cyan-100/52">Pressure simulation</p>
            <h2 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-slate-950 dark:text-white md:text-7xl">Pressure reveals cognition.</h2>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-700 dark:text-white/58">Each arena is an intelligence module. It changes the shape of the room, the questions, and the friction around your reasoning.</p>
          </div>
          <StaggeredGrid className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {practiceTypes.map((type) => <IntelligenceModule key={type} type={type} />)}
          </StaggeredGrid>
        </AnimatedSection>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20">
        <div className="mb-10 max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-cyan-100/52">Adaptive intelligence</p>
          <h2 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-slate-950 dark:text-white md:text-7xl">Reasoning under fire.</h2>
          <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-700 dark:text-white/58">Instead of screenshots, RehearseAI builds live maps of pressure, interruptions, decision branches, and recovery.</p>
        </div>
        <LiveSystemDemo />
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20">
        <div className="rounded-[2.5rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/12 backdrop-blur-2xl md:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-cyan-100/52">Reasoning analytics</p>
              <h2 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-slate-950 dark:text-white md:text-6xl">The system shows how your mind moved.</h2>
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
            <h2 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-slate-950 dark:text-white md:text-7xl">Train your mind like a professional athlete.</h2>
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
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-600 dark:text-white/62">Upload your presentation, thesis, pitch, or proposal. RehearseAI becomes your toughest critic before the real audience does.</p>
            <div className="mt-8"><ButtonLink href="/practice/setup?difficulty=Nerve" variant="secondary">Start Nerve Mode</ButtonLink></div>
          </div>
          <div className="grid gap-3 bg-slate-50 p-8 dark:bg-white/[0.04] md:p-12">
            {["Where is your evidence?", "What industries are excluded?", "What happens if assumption #3 fails?", "That does not answer my question."].map((item) => (
              <motion.div key={item} className="rounded-2xl bg-white p-5 text-lg font-semibold text-slate-800 shadow-[0_14px_36px_rgba(15,23,42,0.06)] ring-1 ring-slate-200 dark:bg-white/[0.08] dark:text-white dark:shadow-none dark:ring-white/10" animate={{ x: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-4 py-20">
        <h2 className="text-center text-5xl font-semibold tracking-[-0.055em] text-slate-950 dark:text-white">FAQ</h2>
        <div className="mt-10 space-y-3">
          {faqs.map(([q, a]) => (
            <AnimatedSection key={q} className="rounded-[1.5rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/12 backdrop-blur-2xl">
              <div className="font-semibold text-slate-950 dark:text-white">{q}</div>
              <p className="mt-2 font-medium leading-7 text-slate-700 dark:text-white/58">{a}</p>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-4 pb-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-white/80 dark:bg-white/[0.08] p-10 text-center ring-1 ring-slate-200/80 dark:ring-white/12 backdrop-blur-2xl md:p-14">
          <Zap className="mx-auto mb-6 text-violet-700 dark:text-cyan-100" size={34} />
          <h2 className="text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-slate-950 dark:text-white md:text-7xl">Enter the simulation.</h2>
          <p className="mx-auto mt-5 max-w-2xl font-medium leading-8 text-slate-700 dark:text-white/58">Build pressure-tested reasoning, confidence, composure, and communication intelligence before the real moment.</p>
          <div className="mt-8">
            <button
              type="button"
              onClick={() => openAuth("signup")}
              className="inline-flex items-center justify-center rounded-full bg-[#6200a8] px-7 py-4 text-base font-semibold text-white shadow-[0_18px_46px_rgba(98,0,168,0.28)] transition hover:-translate-y-0.5 hover:bg-[#50008b]"
            >
              Start Rehearsing Free
            </button>
          </div>
        </div>
      </section>
      <Footer />
      <AuthDialog mode={authMode} onClose={closeAuth} onModeChange={openAuth} />
    </main>
  );
}
