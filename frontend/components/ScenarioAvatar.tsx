"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Activity, Eye, Radio } from "lucide-react";
import type { PracticeType } from "@/lib/types";

const scenes: Record<PracticeType, { label: string; role: string; accent: string; prompt: string }> = {
  "Job Interview": { label: "Hiring room", role: "Hiring manager", accent: "from-sky-400 to-violet-600", prompt: "Probe vague answers" },
  "Presentation / Public Speaking": { label: "Live Q&A", role: "Skeptical audience", accent: "from-cyan-400 to-blue-600", prompt: "Question clarity" },
  "Panel Discussion": { label: "Panel room", role: "Sharp panelist", accent: "from-fuchsia-400 to-violet-700", prompt: "Interrupt lightly" },
  "Thesis Defense": { label: "Defense room", role: "Academic examiner", accent: "from-indigo-400 to-sky-600", prompt: "Test logic" },
  "Salary Negotiation": { label: "Budget room", role: "Budget-conscious manager", accent: "from-emerald-400 to-teal-700", prompt: "Push on evidence" },
  "Difficult Conversation": { label: "Tension room", role: "Emotional counterpart", accent: "from-rose-400 to-orange-500", prompt: "Stay fair" },
  "Teaching Session": { label: "Classroom", role: "Curious student", accent: "from-teal-400 to-cyan-600", prompt: "Ask confused questions" },
  "Sales Pitch": { label: "Buyer room", role: "Skeptical buyer", accent: "from-amber-400 to-rose-500", prompt: "Raise objections" },
};

function SignalWave({ active }: { active: boolean }) {
  return (
    <div className="flex h-10 items-center gap-1.5">
      {Array.from({ length: 22 }).map((_, index) => (
        <motion.span
          key={index}
          animate={active ? { height: [8, 18 + ((index * 9) % 30), 10 + ((index * 5) % 18)] } : { height: 8 + ((index * 3) % 12) }}
          transition={{ duration: 0.9 + (index % 4) * 0.08, repeat: active ? Infinity : 0, ease: "easeInOut" }}
          className="w-1.5 rounded-full bg-cyan-300/90 shadow-[0_0_18px_rgba(103,232,249,0.35)]"
        />
      ))}
    </div>
  );
}

function MiniCharacter({ x, tone, delay }: { x: string; tone: "cyan" | "violet" | "rose"; delay: number }) {
  const accent = tone === "cyan" ? "#67e8f9" : tone === "violet" ? "#c4b5fd" : "#fda4af";
  return (
    <motion.div
      className="absolute bottom-24 h-40 w-28 -translate-x-1/2"
      style={{ left: x }}
      animate={{ y: [0, -6, 0], rotate: [0, delay % 2 ? 1.5 : -1.5, 0] }}
      transition={{ duration: 4.2 + delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 112 160" className="h-full w-full overflow-visible drop-shadow-[0_22px_32px_rgba(0,0,0,0.34)]">
        <ellipse cx="56" cy="150" rx="48" ry="9" fill="rgba(2,6,23,0.48)" />
        <path d="M25 77c7-15 55-15 63 0 8 13 10 38 8 66H17c-2-28 0-53 8-66Z" fill="#172033" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
        <path d="M44 78h24l7 60H37l7-60Z" fill="#e0f2fe" />
        <path d="M42 79l14 15 14-15" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
        <path d="M34 28c0-18 10-27 24-27s25 10 25 28v15c0 18-11 31-25 31S34 62 34 44V28Z" fill="#efb27f" />
        <path d="M32 30C35 10 47 0 62 0c14 0 23 8 25 25-9-6-25-6-39-2-3 10-7 14-16 7Z" fill="#182033" />
        <path d="M45 43c5-3 10-3 14-1M68 42c5-3 10-3 14 0" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
        <motion.ellipse cx="53" cy="53" rx="2.5" ry="3.5" fill="#111827" animate={{ scaleY: [1, 0.08, 1] }} transition={{ duration: 3.5, delay, repeat: Infinity }} />
        <motion.ellipse cx="73" cy="53" rx="2.5" ry="3.5" fill="#111827" animate={{ scaleY: [1, 0.08, 1] }} transition={{ duration: 3.5, delay, repeat: Infinity }} />
        <path d="M52 66c6 4 13 4 20 0" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.62" />
        <motion.path d="M28 95c-10 15-12 27-5 42" stroke="#efb27f" strokeWidth="11" strokeLinecap="round" fill="none" animate={{ d: ["M28 95c-10 15-12 27-5 42", "M28 95c-2 16 7 25 20 34", "M28 95c-10 15-12 27-5 42"] }} transition={{ duration: 3.4, delay, repeat: Infinity, ease: "easeInOut" }} />
        <motion.path d="M85 95c10 15 12 27 5 42" stroke="#efb27f" strokeWidth="11" strokeLinecap="round" fill="none" animate={{ d: ["M85 95c10 15 12 27 5 42", "M85 95c2 16-7 25-20 34", "M85 95c10 15 12 27 5 42"] }} transition={{ duration: 3.5, delay: delay + 0.2, repeat: Infinity, ease: "easeInOut" }} />
      </svg>
    </motion.div>
  );
}

export function ScenarioAvatar({ practiceType, speaking = false }: { practiceType?: PracticeType; speaking?: boolean }) {
  const scene = scenes[practiceType || "Job Interview"];
  const reduce = useReducedMotion();

  return (
    <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-3 text-white shadow-[0_30px_90px_rgba(20,30,60,0.18)] ring-1 ring-white/10">
      <div className="relative min-h-[420px] overflow-hidden rounded-[1.65rem]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:48px_48px] opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/72 to-slate-950/28" />
        <motion.div
          animate={reduce ? undefined : speaking ? { opacity: [0.22, 0.5, 0.22], scale: [1, 1.08, 1] } : { opacity: 0.18, scale: 1 }}
          transition={{ duration: 2.2, repeat: speaking ? Infinity : 0, ease: "easeInOut" }}
          className={`absolute left-1/2 top-[42%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br ${scene.accent} blur-3xl`}
        />
        <div className="absolute bottom-24 left-1/2 h-28 w-[78%] -translate-x-1/2 rounded-[100%] bg-white/[0.06] ring-1 ring-white/12" />
        <MiniCharacter x="34%" tone="cyan" delay={0.2} />
        <MiniCharacter x="50%" tone="violet" delay={0.8} />
        <MiniCharacter x="66%" tone="rose" delay={1.3} />

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
          <div className="rounded-2xl bg-black/35 px-4 py-3 backdrop-blur-xl ring-1 ring-white/12">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-100/80">{scene.label}</div>
            <div className="mt-1 text-xl font-semibold tracking-[-0.035em]">{practiceType || "Rehearsal"}</div>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold backdrop-blur-xl ${speaking ? "bg-emerald-400 text-slate-950" : "bg-white/12 text-white ring-1 ring-white/12"}`}>
            <Radio size={14} /> {speaking ? "Live" : "Ready"}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-[1.35rem] bg-black/45 p-4 backdrop-blur-xl ring-1 ring-white/12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white/55">Persona focus</div>
                <div className="text-2xl font-semibold tracking-[-0.04em]">{scene.role}</div>
              </div>
              <SignalWave active={speaking} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-semibold">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <Eye className="mb-2 text-cyan-200" size={18} />
                {scene.prompt}
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <Activity className="mb-2 text-violet-200" size={18} />
                Character locks in when you speak
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
