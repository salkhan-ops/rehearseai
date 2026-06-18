"use client";

import { motion } from "framer-motion";
import type { EnvironmentMode } from "@/lib/types";

type FigureTone = "neutral" | "skeptical" | "notes" | "forward" | "distant";

type Figure = {
  label: string;
  /** Name Gemini uses in [Name]: tags. Defaults to label when not set. */
  speakerName?: string;
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
      { label: "Neutral", x: "43%", y: "19%", scale: 1.12, tone: "notes" },
      { label: "Skeptical", x: "57%", y: "19%", scale: 1.12, tone: "skeptical", folded: true },
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
      { label: "Panelist", speakerName: "Dr. Chen",       x: "26%", y: "22%", tone: "skeptical", folded: true },
      { label: "Panelist", speakerName: "Prof. Williams", x: "42%", y: "18%", tone: "notes" },
      { label: "Chair",    speakerName: "Chair",          x: "58%", y: "18%", tone: "skeptical", folded: true },
      { label: "Panelist", speakerName: "Dr. Patel",      x: "74%", y: "22%", tone: "distant" },
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

const toneStyles: Record<FigureTone, { jacket: string; jacketDark: string; shirt: string; skin: string; skinShade: string; accent: string; hair: string; hairLight: string; delay: number }> = {
  neutral: { jacket: "#263447", jacketDark: "#0f172a", shirt: "#e0f7ff", skin: "#f0bd8e", skinShade: "#d98d61", accent: "#67e8f9", hair: "#111827", hairLight: "#334155", delay: 0 },
  skeptical: { jacket: "#4c1d2f", jacketDark: "#111827", shirt: "#ffe4e6", skin: "#d99a73", skinShade: "#b86f52", accent: "#fda4af", hair: "#0f172a", hairLight: "#312033", delay: 0.45 },
  notes: { jacket: "#43307e", jacketDark: "#171323", shirt: "#f1edff", skin: "#e9ad7e", skinShade: "#c97b55", accent: "#c4b5fd", hair: "#1f2937", hairLight: "#475569", delay: 0.8 },
  forward: { jacket: "#0f5b48", jacketDark: "#101827", shirt: "#dbf7eb", skin: "#efb27f", skinShade: "#cc7e55", accent: "#6ee7b7", hair: "#101827", hairLight: "#36515a", delay: 0.25 },
  distant: { jacket: "#4c5c70", jacketDark: "#1e293b", shirt: "#f8fafc", skin: "#c98d6c", skinShade: "#9f5f48", accent: "#e2e8f0", hair: "#334155", hairLight: "#64748b", delay: 1.1 },
};

function AvatarFigure({ figure, index, compact = false, isActiveSpeaker = false }: { figure: Figure; index: number; compact?: boolean; isActiveSpeaker?: boolean }) {
  const tone = toneStyles[figure.tone || "neutral"];
  const gradientId = `avatar-jacket-${index}-${(figure.tone || "neutral").replace(/\W/g, "")}`;
  const skinGradientId = `avatar-skin-${index}-${(figure.tone || "neutral").replace(/\W/g, "")}`;
  const hairGradientId = `avatar-hair-${index}-${(figure.tone || "neutral").replace(/\W/g, "")}`;
  const blinkDelay = 1.2 + index * 0.42;
  const armGesture = figure.tone === "forward" || (!figure.folded && index % 2 === 0);
  return (
    <motion.div
      className="absolute -translate-x-1/2"
      style={{ left: figure.x, top: figure.y, scale: (figure.scale || 1) * (compact ? 0.52 : 1) }}
      animate={{ y: [0, -4, 1, 0], rotate: [0, index % 2 ? 0.55 : -0.55, 0] }}
      transition={{ duration: 5.2 + index * 0.18, delay: tone.delay, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <motion.div
        className="relative h-[270px] w-[190px] drop-shadow-[0_32px_42px_rgba(0,0,0,0.38)]"
        animate={{ scaleY: [1, 1.012, 1] }}
        transition={{ duration: 4.1, delay: index * 0.18, repeat: Infinity, ease: "easeInOut" }}
      >
        {isActiveSpeaker && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 rounded-[2rem]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ boxShadow: "0 0 0 2.5px rgba(103,232,249,0.72), 0 0 36px 10px rgba(103,232,249,0.28)" }}
          />
        )}
        <svg viewBox="0 0 190 270" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="38" x2="154" y1="108" y2="222" gradientUnits="userSpaceOnUse">
              <stop stopColor={tone.jacket} />
              <stop offset="1" stopColor={tone.jacketDark} />
            </linearGradient>
            <radialGradient id={skinGradientId} cx="42%" cy="24%" r="76%">
              <stop stopColor="#ffd4aa" />
              <stop offset="0.58" stopColor={tone.skin} />
              <stop offset="1" stopColor={tone.skinShade} />
            </radialGradient>
            <linearGradient id={hairGradientId} x1="52" x2="126" y1="10" y2="70" gradientUnits="userSpaceOnUse">
              <stop stopColor={tone.hairLight} />
              <stop offset="0.42" stopColor={tone.hair} />
              <stop offset="1" stopColor="#070b13" />
            </linearGradient>
          </defs>
          <ellipse cx="95" cy="249" rx="78" ry="14" fill="rgba(2,6,23,0.48)" />
          <path d="M45 111c7-22 23-35 49-35s43 13 51 35v94H45v-94Z" fill="rgba(15,23,42,0.62)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <path d="M42 170c-16 16-20 42-12 61h130c8-19 4-45-12-61-23 12-83 12-106 0Z" fill="rgba(2,6,23,0.42)" />
          <motion.g
            animate={{
              x: [0, index % 2 ? 1.4 : -1.4, 0],
              rotate: [0, index % 2 ? 0.9 : -0.9, 0],
              y: isActiveSpeaker ? -5 : 0,
            }}
            transition={{
              x: { duration: 5, delay: tone.delay, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 5, delay: tone.delay, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 0.6, ease: "easeOut" },
            }}
            style={{ transformOrigin: "95px 64px" }}
          >
            <path d="M72 88h46v35c-9 11-37 11-46 0V88Z" fill={`url(#${skinGradientId})`} opacity="0.9" />
            <ellipse cx="60" cy="63" rx="9" ry="13" fill={tone.skinShade} opacity="0.86" />
            <ellipse cx="130" cy="63" rx="9" ry="13" fill={tone.skinShade} opacity="0.86" />
            <path d="M62 38c0-25 14-36 34-36 22 0 38 14 38 39v23c0 24-16 42-38 42S62 88 62 64V38Z" fill={`url(#${skinGradientId})`} stroke="rgba(255,255,255,0.24)" strokeWidth="2" />
            <path d="M58 39C62 12 78 0 99 0c20 0 35 12 37 34-13-8-34-9-53-4-3 14-10 20-25 9Z" fill={`url(#${hairGradientId})`} />
            <path d="M63 48c5 4 10 6 17 6l3-22c-8 4-15 9-20 16Z" fill={`url(#${hairGradientId})`} />
            <path d="M77 60c7-5 15-5 22-1" stroke="#111827" strokeWidth="4.5" strokeLinecap="round" opacity="0.9" />
            <path d="M109 59c7-5 15-5 21 0" stroke="#111827" strokeWidth="4.5" strokeLinecap="round" opacity="0.9" />
            <motion.ellipse cx="88" cy="75" rx="3.2" ry="4" fill="#111827"
              animate={{ scaleY: [1, 0.08, 1], y: isActiveSpeaker ? -3 : 0 }}
              transition={{ scaleY: { duration: 3.7, delay: blinkDelay, repeat: Infinity, ease: "easeInOut" }, y: { duration: 0.5, ease: "easeOut" } }}
            />
            <motion.ellipse cx="119" cy="75" rx="3.2" ry="4" fill="#111827"
              animate={{ scaleY: [1, 0.08, 1], y: isActiveSpeaker ? -3 : 0 }}
              transition={{ scaleY: { duration: 3.7, delay: blinkDelay, repeat: Infinity, ease: "easeInOut" }, y: { duration: 0.5, ease: "easeOut" } }}
            />
            <path d="M101 77c-2 7-3 12-1 15" stroke="rgba(124,45,18,0.36)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d={figure.tone === "skeptical" ? "M86 94c9 4 22 4 34 0" : "M87 94c8 7 22 7 32 0"} stroke="#7c2d12" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.66" />
            <path d="M74 52c10-18 44-22 60-5" stroke="rgba(255,255,255,0.12)" strokeWidth="7" strokeLinecap="round" />
          </motion.g>
          <path d="M48 112c13-16 80-16 94 0 14 15 20 55 17 105H31c-3-50 3-90 17-105Z" fill={`url(#${gradientId})`} stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
          <path d="M76 111h38l12 103H64l12-103Z" fill={tone.shirt} opacity="0.98" />
          <path d="M73 111l22 28 22-28" fill="none" stroke={tone.accent} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M49 115l34 18-16 23 26 61H37c-2-48 3-85 12-102Z" fill="rgba(255,255,255,0.08)" />
          <path d="M141 115l-34 18 16 23-26 61h56c2-48-3-85-12-102Z" fill="rgba(2,6,23,0.24)" />
          {figure.folded ? (
            <>
              <path d="M43 151c33 25 69 28 104 3" stroke={`url(#${skinGradientId})`} strokeWidth="16" strokeLinecap="round" />
              <path d="M43 150c34 21 70 23 104 2" stroke="rgba(15,23,42,0.32)" strokeWidth="5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <motion.path d="M51 145c-15 24-20 46-15 68" stroke={`url(#${skinGradientId})`} strokeWidth="17" strokeLinecap="round" fill="none" animate={armGesture ? { d: ["M51 145c-15 24-20 46-15 68", "M51 145c-7 24 3 43 21 57", "M51 145c-15 24-20 46-15 68"] } : undefined} transition={{ duration: 3.6, delay: tone.delay, repeat: Infinity, ease: "easeInOut" }} />
              <motion.path d="M139 145c15 24 20 46 15 68" stroke={`url(#${skinGradientId})`} strokeWidth="17" strokeLinecap="round" fill="none" animate={armGesture ? { d: ["M139 145c15 24 20 46 15 68", "M139 145c7 24-3 43-21 57", "M139 145c15 24 20 46 15 68"] } : undefined} transition={{ duration: 3.8, delay: tone.delay + 0.2, repeat: Infinity, ease: "easeInOut" }} />
            </>
          )}
          {(figure.tone === "notes" || index % 5 === 0) && (
            <motion.g animate={{ y: [0, -2, 0], rotate: [0, 1.2, 0] }} transition={{ duration: 2.8, delay: 0.4 + index * 0.1, repeat: Infinity, ease: "easeInOut" }}>
              <rect x="62" y="196" width="68" height="40" rx="7" fill="#f8fafc" opacity="0.96" />
              <path d="M74 209h42M74 219h32" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M65 196h62" stroke={tone.accent} strokeWidth="5" strokeLinecap="round" opacity="0.72" />
            </motion.g>
          )}
          <path d="M45 217h100" stroke={tone.accent} strokeWidth="4.5" strokeLinecap="round" opacity="0.58" />
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

export function AICharacterEnvironment({ mode = "AI Orb", preview = false, activeSpeaker = null, containerClassName }: { mode?: EnvironmentMode; preview?: boolean; activeSpeaker?: string | null; containerClassName?: string }) {
  const scene = scenes[mode] || scenes["AI Orb"];
  if (mode === "AI Orb" && !preview) return null;
  const defaultClass = preview
    ? "relative h-52 w-full overflow-hidden rounded-[1.5rem] bg-[#07111f] ring-1 ring-slate-200 dark:ring-white/10"
    : "absolute inset-x-0 top-6 z-[1] mx-auto h-[34rem] max-w-6xl overflow-hidden rounded-[2rem] opacity-100 [mask-image:linear-gradient(to_bottom,transparent,black_5%,black_82%,transparent)]";
  return (
    <div className={`pointer-events-none ${containerClassName ?? defaultClass}`}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:48px_48px] opacity-35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(103,232,249,0.15),transparent_34%),radial-gradient(circle_at_74%_42%,rgba(167,139,250,0.16),transparent_30%)]" />
      <motion.div
        className={`absolute left-1/2 ${preview ? "top-12 h-44 w-[82%]" : "top-16 h-[28rem] w-[72%]"} -translate-x-1/2 rounded-[100%] bg-cyan-300/8 blur-3xl`}
        animate={{ opacity: [0.38, 0.7, 0.42], scale: [0.96, 1.04, 0.98] }}
        transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className={`absolute inset-x-8 ${preview ? "top-20" : "top-28"} h-28 rounded-[100%] border border-white/16 bg-white/[0.05] shadow-[0_28px_120px_rgba(0,0,0,0.34)]`} />
      {mode === "AI Orb" && <MiniOrb />}
      {(scene.layout === "board" || scene.layout === "panel") && (
        <>
          <div className={`absolute left-1/2 ${preview ? "top-32" : "top-[16.5rem]"} h-24 w-[78%] -translate-x-1/2 rounded-[100%] bg-slate-950/46 ring-1 ring-white/14`} />
          <div className={`absolute left-1/2 ${preview ? "top-[9.2rem]" : "top-[19.5rem]"} h-16 w-[64%] -translate-x-1/2 rounded-[100%] border border-cyan-100/22 bg-cyan-100/[0.035] shadow-[0_24px_90px_rgba(34,211,238,0.08)]`} />
        </>
      )}
      {scene.layout === "audience" && <div className={`absolute left-1/2 ${preview ? "top-32" : "top-48"} h-24 w-[82%] -translate-x-1/2 rounded-[100%] bg-slate-950/34 ring-1 ring-white/12`} />}
      {scene.figures.map((figure, index) => (
        <AvatarFigure
          key={`${figure.label}-${index}`}
          figure={figure}
          index={index}
          compact={preview}
          isActiveSpeaker={!preview && activeSpeaker !== null && (figure.speakerName ?? figure.label) === activeSpeaker}
        />
      ))}
      {mode !== "AI Orb" && (
        <div className={`absolute left-1/2 ${preview ? "bottom-7 h-9 w-[74%]" : "bottom-[5.6rem] h-20 w-[62%]"} -translate-x-1/2 rounded-[100%] border border-white/12 bg-gradient-to-b from-white/[0.13] to-slate-950/20 shadow-[0_22px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm`} />
      )}
      <div className={`absolute ${preview ? "bottom-4" : "top-4"} left-1/2 -translate-x-1/2 rounded-full bg-white/[0.11] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/72 ring-1 ring-white/18`}>
        {scene.title}
      </div>
    </div>
  );
}
