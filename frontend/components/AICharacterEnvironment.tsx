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

const publicAsset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path}`;

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

const toneStyles: Record<FigureTone, { jacket: string; shirt: string; skin: string; accent: string; hair: string; delay: number }> = {
  neutral: { jacket: "from-slate-500 to-slate-800", shirt: "bg-cyan-100", skin: "bg-[#f4c7a1]", accent: "bg-cyan-300", hair: "bg-slate-950", delay: 0 },
  skeptical: { jacket: "from-rose-900 to-slate-950", shirt: "bg-rose-100", skin: "bg-[#d9a184]", accent: "bg-rose-300", hair: "bg-slate-950", delay: 0.45 },
  notes: { jacket: "from-violet-800 to-slate-950", shirt: "bg-violet-100", skin: "bg-[#e8b894]", accent: "bg-violet-300", hair: "bg-slate-900", delay: 0.8 },
  forward: { jacket: "from-emerald-800 to-slate-950", shirt: "bg-emerald-100", skin: "bg-[#f0bc95]", accent: "bg-emerald-300", hair: "bg-slate-950", delay: 0.25 },
  distant: { jacket: "from-slate-400 to-slate-800", shirt: "bg-white", skin: "bg-[#c9957d]", accent: "bg-white", hair: "bg-slate-800", delay: 1.1 },
};

function AvatarFigure({ figure, index, compact = false }: { figure: Figure; index: number; compact?: boolean }) {
  const tone = toneStyles[figure.tone || "neutral"];
  return (
    <motion.div
      className="absolute -translate-x-1/2"
      style={{ left: figure.x, top: figure.y, scale: (figure.scale || 1) * (compact ? 0.84 : 1.55) }}
      animate={{ y: [0, -3, 1, 0], rotate: [0, index % 2 ? 0.7 : -0.7, 0] }}
      transition={{ duration: 5.4 + index * 0.22, delay: tone.delay, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <motion.div
        className="relative h-40 w-32"
        animate={{ scaleY: [1, 1.015, 1] }}
        transition={{ duration: 3.8, delay: index * 0.18, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute bottom-0 left-1/2 h-24 w-32 -translate-x-1/2 rounded-t-[2rem] bg-slate-950/76 ring-2 ring-white/20 shadow-[0_28px_90px_rgba(0,0,0,0.42)]" />
        <div className="absolute bottom-2 left-1/2 h-14 w-24 -translate-x-1/2 rounded-t-[1.5rem] bg-slate-800/88 ring-1 ring-white/16" />
        <motion.div
          className={`absolute left-1/2 top-0 h-14 w-14 -translate-x-1/2 rounded-[1.4rem] ${tone.skin} shadow-[0_12px_34px_rgba(0,0,0,0.28),inset_0_-8px_16px_rgba(15,23,42,0.12)] ring-2 ring-white/28`}
          animate={{ x: [0, index % 3 === 0 ? -2 : 2, 0] }}
          transition={{ duration: 4.8, delay: 0.35 + index * 0.12, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className={`absolute -top-2 left-1/2 h-5 w-12 -translate-x-1/2 rounded-t-2xl ${tone.hair}`} />
          <motion.span className="absolute left-4 top-6 h-1.5 w-1.5 rounded-full bg-slate-950/78" animate={{ scaleY: [1, 0.12, 1] }} transition={{ duration: 3.6, delay: 1 + index * 0.37, repeat: Infinity }} />
          <motion.span className="absolute right-4 top-6 h-1.5 w-1.5 rounded-full bg-slate-950/78" animate={{ scaleY: [1, 0.12, 1] }} transition={{ duration: 3.6, delay: 1 + index * 0.37, repeat: Infinity }} />
          <span className="absolute left-1/2 top-9 h-1 w-6 -translate-x-1/2 rounded-full bg-slate-950/34" />
        </motion.div>
        <div className={`absolute left-1/2 top-12 h-24 w-24 -translate-x-1/2 rounded-t-[2rem] bg-gradient-to-b ${tone.jacket} ring-2 ring-white/24 shadow-[0_22px_50px_rgba(0,0,0,0.32)]`} />
        <div className={`absolute left-1/2 top-[4.2rem] h-16 w-10 -translate-x-1/2 rounded-t-xl ${tone.shirt}`} />
        <div className={`absolute left-1/2 top-[4.15rem] h-2 w-12 -translate-x-1/2 rounded-full ${tone.accent} opacity-80`} />
        {figure.folded ? (
          <>
            <div className="absolute left-5 top-[6.4rem] h-3 w-20 rotate-12 rounded-full bg-[#d9a184] ring-1 ring-white/16" />
            <div className="absolute right-5 top-[6.4rem] h-3 w-20 -rotate-12 rounded-full bg-[#d9a184] ring-1 ring-white/16" />
          </>
        ) : (
          <>
            <div className="absolute left-3 top-[5.7rem] h-14 w-4 -rotate-12 rounded-full bg-[#e8b894] ring-1 ring-white/16" />
            <div className="absolute right-3 top-[5.7rem] h-14 w-4 rotate-12 rounded-full bg-[#e8b894] ring-1 ring-white/16" />
          </>
        )}
        {(figure.tone === "notes" || index % 5 === 0) && <div className="absolute bottom-3 left-1/2 h-5 w-16 -translate-x-1/2 rounded bg-white/88 ring-1 ring-white/30 shadow-[0_8px_20px_rgba(0,0,0,0.2)]" />}
        <div className="absolute -bottom-1 left-1/2 h-4 w-40 -translate-x-1/2 rounded-full bg-slate-950/68 ring-1 ring-white/12" />
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
  if (mode !== "AI Orb") {
    const participantCount = Math.max(1, scene.figures.length);
    const descriptor = participantCount === 1 ? "Interviewer present" : `${participantCount}-person room`;
    return (
      <div className={`pointer-events-none ${preview ? "relative h-52 w-full overflow-hidden rounded-[1.5rem] bg-[#07111f] ring-1 ring-slate-200 dark:ring-white/10" : "absolute inset-x-0 top-6 z-[1] mx-auto h-[34rem] max-w-6xl overflow-hidden rounded-[2rem] opacity-100 shadow-[0_34px_120px_rgba(0,0,0,0.28)] ring-1 ring-white/10 [mask-image:linear-gradient(to_bottom,transparent,black_5%,black_88%,transparent)]"}`}>
        <img
          src={publicAsset("/scenes/panel-room-3d.png")}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover ${preview ? "scale-105" : "scale-[1.03]"}`}
          style={{ objectPosition: scene.layout === "audience" ? "center 42%" : "center 48%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07111f]/28 via-[#07111f]/12 to-[#07111f]/76" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(103,232,249,0.22),transparent_32%),linear-gradient(90deg,rgba(7,17,31,0.74),transparent_28%,transparent_72%,rgba(49,46,129,0.58))]" />
        <motion.div
          className="absolute left-1/2 top-[54%] h-32 w-[78%] -translate-x-1/2 rounded-[100%] border border-cyan-100/38 bg-cyan-100/5 shadow-[0_0_70px_rgba(56,189,248,0.16)]"
          animate={{ opacity: [0.44, 0.72, 0.48], scaleX: [0.98, 1.03, 0.98] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className={`absolute ${preview ? "bottom-4" : "top-4"} left-1/2 -translate-x-1/2 rounded-full bg-slate-950/58 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/86 ring-1 ring-cyan-100/22 backdrop-blur-xl`}>
          {scene.title}
        </div>
        <div className={`absolute left-1/2 ${preview ? "bottom-4 hidden" : "bottom-16"} -translate-x-1/2 rounded-full bg-slate-950/62 px-4 py-2 text-xs font-semibold text-cyan-50/86 ring-1 ring-white/14 backdrop-blur-xl`}>
          {descriptor}
        </div>
      </div>
    );
  }
  return (
    <div className={`pointer-events-none ${preview ? "relative h-52 w-full overflow-hidden rounded-[1.5rem] bg-[#07111f] ring-1 ring-slate-200 dark:ring-white/10" : "absolute inset-x-0 top-6 z-[1] mx-auto h-[34rem] max-w-6xl overflow-hidden rounded-[2rem] opacity-100 [mask-image:linear-gradient(to_bottom,transparent,black_5%,black_82%,transparent)]"}`}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:48px_48px] opacity-35" />
      <div className={`absolute inset-x-8 ${preview ? "top-20" : "top-28"} h-28 rounded-[100%] border border-white/16 bg-white/[0.05] shadow-[0_28px_120px_rgba(0,0,0,0.34)]`} />
      {mode === "AI Orb" && <MiniOrb />}
      {(scene.layout === "board" || scene.layout === "panel") && <div className={`absolute left-1/2 ${preview ? "top-32" : "top-48"} h-20 w-[76%] -translate-x-1/2 rounded-[100%] bg-slate-950/44 ring-1 ring-white/14`} />}
      {scene.layout === "audience" && <div className={`absolute left-1/2 ${preview ? "top-32" : "top-48"} h-24 w-[82%] -translate-x-1/2 rounded-[100%] bg-slate-950/34 ring-1 ring-white/12`} />}
      {scene.figures.map((figure, index) => <AvatarFigure key={`${figure.label}-${index}`} figure={figure} index={index} compact={preview} />)}
      <div className={`absolute ${preview ? "bottom-4" : "top-4"} left-1/2 -translate-x-1/2 rounded-full bg-white/[0.11] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/72 ring-1 ring-white/18`}>
        {scene.title}
      </div>
    </div>
  );
}
