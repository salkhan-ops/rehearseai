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

const toneStyles: Record<FigureTone, { jacket: string; jacketDark: string; shirt: string; skin: string; accent: string; hair: string; delay: number }> = {
  neutral: { jacket: "#314158", jacketDark: "#111827", shirt: "#cffafe", skin: "#f0bd8e", accent: "#67e8f9", hair: "#111827", delay: 0 },
  skeptical: { jacket: "#4c1d2f", jacketDark: "#111827", shirt: "#ffe4e6", skin: "#d99a73", accent: "#fda4af", hair: "#0f172a", delay: 0.45 },
  notes: { jacket: "#4c1d95", jacketDark: "#171323", shirt: "#ede9fe", skin: "#e9ad7e", accent: "#c4b5fd", hair: "#1f2937", delay: 0.8 },
  forward: { jacket: "#065f46", jacketDark: "#111827", shirt: "#d1fae5", skin: "#efb27f", accent: "#6ee7b7", hair: "#101827", delay: 0.25 },
  distant: { jacket: "#64748b", jacketDark: "#1e293b", shirt: "#f8fafc", skin: "#c98d6c", accent: "#e2e8f0", hair: "#334155", delay: 1.1 },
};

function AvatarFigure({ figure, index, compact = false }: { figure: Figure; index: number; compact?: boolean }) {
  const tone = toneStyles[figure.tone || "neutral"];
  const gradientId = `avatar-jacket-${index}-${(figure.tone || "neutral").replace(/\W/g, "")}`;
  const blinkDelay = 1.2 + index * 0.42;
  const armGesture = figure.tone === "forward" || (!figure.folded && index % 2 === 0);
  return (
    <motion.div
      className="absolute -translate-x-1/2"
      style={{ left: figure.x, top: figure.y, scale: (figure.scale || 1) * (compact ? 0.62 : 1.18) }}
      animate={{ y: [0, -5, 1, 0], rotate: [0, index % 2 ? 0.9 : -0.9, 0] }}
      transition={{ duration: 5.2 + index * 0.18, delay: tone.delay, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <motion.div
        className="relative h-[220px] w-[160px] drop-shadow-[0_28px_42px_rgba(0,0,0,0.36)]"
        animate={{ scaleY: [1, 1.012, 1] }}
        transition={{ duration: 4.1, delay: index * 0.18, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 160 220" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="32" x2="130" y1="78" y2="178" gradientUnits="userSpaceOnUse">
              <stop stopColor={tone.jacket} />
              <stop offset="1" stopColor={tone.jacketDark} />
            </linearGradient>
          </defs>
          <ellipse cx="80" cy="206" rx="66" ry="13" fill="rgba(2,6,23,0.52)" />
          <rect x="26" y="100" width="108" height="88" rx="29" fill="rgba(15,23,42,0.86)" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
          <motion.g
            animate={{ x: [0, index % 2 ? 2 : -2, 0], rotate: [0, index % 2 ? 1.4 : -1.4, 0] }}
            transition={{ duration: 5, delay: tone.delay, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "80px 52px" }}
          >
            <path d="M54 34c0-21 13-30 29-30 18 0 31 12 31 33v20c0 20-13 35-31 35S54 77 54 57V34Z" fill={tone.skin} stroke="rgba(255,255,255,0.28)" strokeWidth="2" />
            <path d="M51 34c4-22 17-32 35-32 17 0 29 11 30 29-11-8-29-8-45-4-3 12-8 18-20 7Z" fill={tone.hair} />
            <path d="M54 41c4 3 8 5 14 5l2-18c-6 3-12 7-16 13Z" fill={tone.hair} />
            <path d="M68 54c6-4 12-4 18-1" stroke="#111827" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
            <path d="M96 53c6-4 12-4 17 0" stroke="#111827" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
            <motion.ellipse cx="77" cy="66" rx="3" ry="4" fill="#111827" animate={{ scaleY: [1, 0.08, 1] }} transition={{ duration: 3.7, delay: blinkDelay, repeat: Infinity, ease: "easeInOut" }} />
            <motion.ellipse cx="104" cy="66" rx="3" ry="4" fill="#111827" animate={{ scaleY: [1, 0.08, 1] }} transition={{ duration: 3.7, delay: blinkDelay, repeat: Infinity, ease: "easeInOut" }} />
            <path d={figure.tone === "skeptical" ? "M72 81c8 5 18 5 28 0" : "M73 81c7 7 18 7 27 0"} stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.62" />
          </motion.g>
          <path d="M45 93c11-12 58-12 70 0 11 12 16 46 14 88H31c-2-42 3-76 14-88Z" fill={`url(#${gradientId})`} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <path d="M67 93h26l9 86H58l9-86Z" fill={tone.shirt} opacity="0.96" />
          <path d="M66 94l14 18 14-18" fill="none" stroke={tone.accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          {figure.folded ? (
            <>
              <path d="M37 122c28 22 57 25 88 3" stroke={tone.skin} strokeWidth="15" strokeLinecap="round" />
              <path d="M37 121c29 18 58 20 88 1" stroke="rgba(15,23,42,0.28)" strokeWidth="5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <motion.path d="M45 118c-13 19-18 37-14 56" stroke={tone.skin} strokeWidth="16" strokeLinecap="round" fill="none" animate={armGesture ? { d: ["M45 118c-13 19-18 37-14 56", "M45 118c-5 20-1 37 13 51", "M45 118c-13 19-18 37-14 56"] } : undefined} transition={{ duration: 3.6, delay: tone.delay, repeat: Infinity, ease: "easeInOut" }} />
              <motion.path d="M116 118c14 19 18 38 14 56" stroke={tone.skin} strokeWidth="16" strokeLinecap="round" fill="none" animate={armGesture ? { d: ["M116 118c14 19 18 38 14 56", "M116 118c3 20-1 36-16 50", "M116 118c14 19 18 38 14 56"] } : undefined} transition={{ duration: 3.8, delay: tone.delay + 0.2, repeat: Infinity, ease: "easeInOut" }} />
            </>
          )}
          {(figure.tone === "notes" || index % 5 === 0) && (
            <motion.g animate={{ y: [0, -2, 0], rotate: [0, 1.2, 0] }} transition={{ duration: 2.8, delay: 0.4 + index * 0.1, repeat: Infinity, ease: "easeInOut" }}>
              <rect x="52" y="164" width="58" height="32" rx="5" fill="#f8fafc" opacity="0.95" />
              <path d="M61 174h37M61 183h28" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
            </motion.g>
          )}
          <path d="M41 181h78" stroke={tone.accent} strokeWidth="4" strokeLinecap="round" opacity="0.65" />
        </svg>
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
      <div className={`absolute ${preview ? "bottom-4" : "top-4"} left-1/2 -translate-x-1/2 rounded-full bg-white/[0.11] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/72 ring-1 ring-white/18`}>
        {scene.title}
      </div>
    </div>
  );
}
