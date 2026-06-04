"use client";

import { motion } from "framer-motion";
import type { EnvironmentMode } from "@/lib/types";

type FigureTone = "neutral" | "skeptical" | "notes" | "forward" | "distant";

type Figure = {
  label: string;
  x: string;
  y: string;
  scale?: number;
  tone?: FigureTone;
  folded?: boolean;
};

const scenes: Record<EnvironmentMode, { title: string; layout: "interview" | "panel" | "audience" | "board"; figures: Figure[] }> = {
  "AI Orb": { title: "AI Orb", layout: "interview", figures: [] },
  "Single Interviewer": {
    title: "Single Interviewer",
    layout: "interview",
    figures: [{ label: "Interviewer", x: "50%", y: "20%", scale: 1.15, tone: "neutral" }],
  },
  "Executive Interview": {
    title: "Executive Interview",
    layout: "panel",
    figures: [
      { label: "Neutral", x: "39%", y: "20%", tone: "notes" },
      { label: "Skeptical", x: "61%", y: "20%", tone: "skeptical", folded: true },
    ],
  },
  "Thesis Defense Panel": {
    title: "Thesis Defense Panel",
    layout: "panel",
    figures: [
      { label: "Professor", x: "33%", y: "19%", tone: "notes" },
      { label: "Chair", x: "50%", y: "17%", scale: 1.06, tone: "neutral" },
      { label: "Reader", x: "67%", y: "20%", tone: "distant" },
    ],
  },
  "Investor Panel": {
    title: "Investor Panel",
    layout: "panel",
    figures: [
      { label: "Partner", x: "32%", y: "19%", tone: "forward" },
      { label: "Analyst", x: "50%", y: "18%", tone: "notes" },
      { label: "Skeptic", x: "68%", y: "20%", tone: "skeptical", folded: true },
    ],
  },
  "Board Meeting": {
    title: "Board Meeting",
    layout: "board",
    figures: [
      { label: "CEO", x: "24%", y: "22%", tone: "neutral" },
      { label: "CFO", x: "38%", y: "18%", tone: "notes" },
      { label: "Ops", x: "52%", y: "17%", tone: "forward" },
      { label: "Strategy", x: "66%", y: "18%", tone: "notes" },
      { label: "Director", x: "80%", y: "22%", tone: "skeptical", folded: true },
    ],
  },
  "Classroom Presentation": {
    title: "Classroom Presentation",
    layout: "audience",
    figures: Array.from({ length: 14 }, (_, index) => ({
      label: "Audience",
      x: `${18 + (index % 7) * 11}%`,
      y: `${18 + Math.floor(index / 7) * 13}%`,
      scale: 0.78 + (index % 3) * 0.04,
      tone: index % 4 === 0 ? "notes" : "neutral",
    })),
  },
  "Hostile Panel": {
    title: "Hostile Panel",
    layout: "panel",
    figures: [
      { label: "Panelist", x: "26%", y: "22%", tone: "skeptical", folded: true },
      { label: "Panelist", x: "42%", y: "18%", tone: "notes" },
      { label: "Chair", x: "58%", y: "18%", tone: "skeptical", folded: true },
      { label: "Panelist", x: "74%", y: "22%", tone: "distant" },
    ],
  },
  "Conference Q&A": {
    title: "Conference Q&A",
    layout: "audience",
    figures: Array.from({ length: 18 }, (_, index) => ({
      label: "Q&A",
      x: `${12 + (index % 9) * 9.5}%`,
      y: `${16 + Math.floor(index / 9) * 12}%`,
      scale: 0.7 + (index % 4) * 0.05,
      tone: index % 5 === 0 ? "forward" : "neutral",
    })),
  },
  "Custom Future Mode": {
    title: "Custom Future Mode",
    layout: "panel",
    figures: [
      { label: "Advisor", x: "30%", y: "20%", tone: "notes" },
      { label: "Observer", x: "50%", y: "18%", tone: "neutral" },
      { label: "Challenger", x: "70%", y: "20%", tone: "skeptical", folded: true },
    ],
  },
};

const toneStyles: Record<FigureTone, { body: string; face: string; accent: string; delay: number }> = {
  neutral: { body: "from-cyan-200/22 to-slate-500/18", face: "bg-cyan-100/78", accent: "bg-cyan-200/36", delay: 0 },
  skeptical: { body: "from-rose-200/24 to-slate-500/18", face: "bg-rose-100/78", accent: "bg-rose-200/40", delay: 0.45 },
  notes: { body: "from-violet-200/24 to-slate-500/18", face: "bg-violet-100/78", accent: "bg-violet-200/38", delay: 0.8 },
  forward: { body: "from-emerald-200/24 to-slate-500/18", face: "bg-emerald-100/78", accent: "bg-emerald-200/40", delay: 0.25 },
  distant: { body: "from-white/20 to-slate-500/16", face: "bg-white/70", accent: "bg-white/26", delay: 1.1 },
};

function AvatarFigure({ figure, index, compact = false }: { figure: Figure; index: number; compact?: boolean }) {
  const tone = toneStyles[figure.tone || "neutral"];
  return (
    <motion.div
      className="absolute -translate-x-1/2"
      style={{ left: figure.x, top: figure.y, scale: (figure.scale || 1) * (compact ? 0.72 : 1) }}
      animate={{ y: [0, -4, 1, 0], rotate: [0, index % 2 ? 1.1 : -1.1, 0] }}
      transition={{ duration: 5.4 + index * 0.22, delay: tone.delay, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <motion.div
        className={`relative h-28 w-24 rounded-t-[2.25rem] bg-gradient-to-b ${tone.body} ring-1 ring-white/25 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl`}
        animate={{ scaleY: [1, 1.015, 1] }}
        transition={{ duration: 3.8, delay: index * 0.18, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          className={`absolute left-1/2 top-5 h-9 w-10 -translate-x-1/2 rounded-[1.1rem] ${tone.face} shadow-[inset_0_-8px_16px_rgba(15,23,42,0.16)]`}
          animate={{ x: [0, index % 3 === 0 ? -2 : 2, 0] }}
          transition={{ duration: 4.8, delay: 0.35 + index * 0.12, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.span className="absolute left-2 top-4 h-1 w-1 rounded-full bg-slate-900/58" animate={{ scaleY: [1, 0.1, 1] }} transition={{ duration: 3.6, delay: 1 + index * 0.37, repeat: Infinity }} />
          <motion.span className="absolute right-2 top-4 h-1 w-1 rounded-full bg-slate-900/58" animate={{ scaleY: [1, 0.1, 1] }} transition={{ duration: 3.6, delay: 1 + index * 0.37, repeat: Infinity }} />
        </motion.div>
        <div className={`absolute bottom-7 left-1/2 h-7 w-14 -translate-x-1/2 rounded-full ${tone.accent}`} />
        {figure.folded ? (
          <>
            <div className="absolute bottom-8 left-3 h-1.5 w-12 rotate-12 rounded-full bg-white/38" />
            <div className="absolute bottom-8 right-3 h-1.5 w-12 -rotate-12 rounded-full bg-white/38" />
          </>
        ) : (
          <>
            <div className="absolute bottom-7 left-4 h-9 w-2 -rotate-12 rounded-full bg-white/28" />
            <div className="absolute bottom-7 right-4 h-9 w-2 rotate-12 rounded-full bg-white/28" />
          </>
        )}
        {(figure.tone === "notes" || index % 5 === 0) && <div className="absolute -bottom-2 left-1/2 h-4 w-12 -translate-x-1/2 rounded bg-white/38 ring-1 ring-white/20" />}
      </motion.div>
    </motion.div>
  );
}

function MiniOrb() {
  return (
    <div className="absolute left-1/2 top-1/2 grid size-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-cyan-200/12 ring-1 ring-cyan-100/24">
      <motion.div
        className="absolute size-32 rounded-full bg-gradient-to-br from-cyan-200/38 via-violet-300/34 to-blue-500/22 blur-2xl"
        animate={{ scale: [0.9, 1.1, 0.94], opacity: [0.55, 0.95, 0.65] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="relative size-20 rounded-full bg-gradient-to-br from-slate-100 via-cyan-200 to-violet-300 shadow-[0_0_70px_rgba(125,211,252,0.46)]"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export function AICharacterEnvironment({ mode = "AI Orb", preview = false }: { mode?: EnvironmentMode; preview?: boolean }) {
  const scene = scenes[mode] || scenes["AI Orb"];
  if (mode === "AI Orb" && !preview) return null;
  return (
    <div className={`pointer-events-none ${preview ? "relative h-52 w-full overflow-hidden rounded-[1.5rem] bg-[#07111f] ring-1 ring-slate-200 dark:ring-white/10" : "absolute inset-x-0 top-6 z-[1] mx-auto h-[34rem] max-w-6xl overflow-hidden rounded-[2rem] opacity-100 [mask-image:linear-gradient(to_bottom,transparent,black_5%,black_82%,transparent)]"}`}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:48px_48px] opacity-35" />
      <div className={`absolute inset-x-8 ${preview ? "top-20" : "top-28"} h-28 rounded-[100%] border border-white/16 bg-white/[0.05] shadow-[0_28px_120px_rgba(0,0,0,0.34)]`} />
      {mode === "AI Orb" && <MiniOrb />}
      {(scene.layout === "board" || scene.layout === "panel") && <div className={`absolute left-1/2 ${preview ? "top-32" : "top-48"} h-20 w-[76%] -translate-x-1/2 rounded-[100%] bg-slate-950/44 ring-1 ring-white/14`} />}
      {scene.layout === "audience" && <div className={`absolute left-1/2 ${preview ? "top-32" : "top-48"} h-24 w-[82%] -translate-x-1/2 rounded-[100%] bg-slate-950/34 ring-1 ring-white/12`} />}
      {scene.figures.map((figure, index) => <AvatarFigure key={`${figure.label}-${index}`} figure={figure} index={index} compact={preview} />)}
      <div className={`absolute ${preview ? "bottom-4" : "bottom-12"} left-1/2 -translate-x-1/2 rounded-full bg-white/[0.09] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/64 ring-1 ring-white/14`}>
        {scene.title}
      </div>
    </div>
  );
}
