"use client";

import { motion, useReducedMotion } from "framer-motion";

type OrbState = "idle" | "listening" | "thinking" | "speaking" | "pressure" | "error";

const stateStyles: Record<OrbState, { aura: string; core: string; label: string; rhythm: number; scale: number }> = {
  idle: {
    aura: "from-cyan-300/30 via-violet-400/30 to-blue-500/20",
    core: "from-slate-200 via-cyan-200 to-violet-300",
    label: "Ready",
    rhythm: 4.4,
    scale: 1,
  },
  listening: {
    aura: "from-cyan-300/45 via-sky-400/35 to-violet-500/25",
    core: "from-cyan-100 via-sky-300 to-violet-400",
    label: "Listening",
    rhythm: 2.6,
    scale: 1.04,
  },
  thinking: {
    aura: "from-violet-300/45 via-fuchsia-400/30 to-cyan-400/20",
    core: "from-violet-100 via-fuchsia-300 to-cyan-300",
    label: "Thinking",
    rhythm: 1.8,
    scale: 0.98,
  },
  speaking: {
    aura: "from-violet-300/55 via-blue-400/35 to-cyan-300/35",
    core: "from-violet-100 via-blue-300 to-cyan-200",
    label: "Responding",
    rhythm: 2.1,
    scale: 1.08,
  },
  pressure: {
    aura: "from-rose-300/35 via-violet-400/40 to-cyan-300/20",
    core: "from-rose-100 via-violet-300 to-cyan-300",
    label: "Pressure rising",
    rhythm: 1.35,
    scale: 1.02,
  },
  error: {
    aura: "from-amber-300/35 via-rose-300/25 to-violet-400/20",
    core: "from-amber-100 via-rose-200 to-violet-300",
    label: "Fallback ready",
    rhythm: 3.2,
    scale: 0.96,
  },
};

// Plain CSS keyframe animation (see .orb-spoke in globals.css) instead of 36 individually
// JS-driven framer-motion instances -- those ran on the main thread from first mount,
// competing with hydration on slow/low-power mobile devices right in the hero's critical path.
function OrbWave({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-[-2.25rem] flex items-center justify-center">
      {Array.from({ length: 36 }).map((_, index) => (
        <span
          key={index}
          className={`orb-spoke absolute h-1.5 w-7 rounded-full bg-cyan-100/65 shadow-[0_0_18px_rgba(125,211,252,0.45)] ${active ? "orb-spoke--active" : ""}`}
          style={{
            rotate: `${index * 10}deg`,
            transformOrigin: "50% 138px",
            animationDuration: `${1.8 + (index % 5) * 0.12}s`,
            opacity: active ? undefined : 0.18,
            transform: active ? undefined : "scaleX(0.7)",
          }}
        />
      ))}
    </div>
  );
}

export function AIPresenceOrb({ state, intensity = 0.5 }: { state: OrbState; intensity?: number }) {
  const reduce = useReducedMotion();
  const style = stateStyles[state];
  const active = state !== "idle" && state !== "error";

  return (
    <div className="relative grid min-h-[360px] place-items-center sm:min-h-[460px]">
      <motion.div
        className={`absolute h-[21rem] w-[21rem] rounded-full bg-gradient-to-br ${style.aura} blur-3xl sm:h-[31rem] sm:w-[31rem]`}
        animate={reduce ? undefined : { scale: [0.96, 1.08 + intensity * 0.06, 0.98], opacity: [0.48, 0.82, 0.55] }}
        transition={{ duration: style.rhythm, repeat: Infinity, ease: "easeInOut" }}
      />
      <OrbWave active={active} />
      <motion.div
        className="absolute h-72 w-72 rounded-full border border-white/16 sm:h-96 sm:w-96"
        animate={reduce ? undefined : { rotate: 360, scale: [1, 1.02, 1] }}
        transition={{ rotate: { duration: 24, repeat: Infinity, ease: "linear" }, scale: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
      />
      <motion.div
        className="absolute h-56 w-56 rounded-full border border-cyan-100/20 sm:h-80 sm:w-80"
        animate={reduce ? undefined : { rotate: -360, borderColor: active ? "rgba(165,243,252,0.42)" : "rgba(255,255,255,0.18)" }}
        transition={{ rotate: { duration: 32, repeat: Infinity, ease: "linear" }, borderColor: { duration: 0.8 } }}
      />
      <motion.div
        className={`relative h-44 w-44 overflow-hidden rounded-full bg-gradient-to-br ${style.core} shadow-[0_0_120px_rgba(129,140,248,0.48)] sm:h-64 sm:w-64`}
        animate={reduce ? undefined : { scale: [style.scale, style.scale + 0.035, style.scale], borderRadius: state === "pressure" ? ["50%", "45% 55% 48% 52%", "50%"] : "50%" }}
        transition={{ duration: style.rhythm, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.9),transparent_22%),radial-gradient(circle_at_70%_75%,rgba(59,130,246,0.55),transparent_30%)]" />
        <motion.div
          className="absolute inset-[-30%] bg-[conic-gradient(from_90deg,transparent,rgba(255,255,255,0.72),transparent,rgba(34,211,238,0.5),transparent)]"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: active ? 8 : 16, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-5 rounded-full bg-slate-950/10 backdrop-blur-[2px]" />
      </motion.div>
      <motion.div
        className="absolute bottom-8 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white/80 shadow-[0_10px_35px_rgba(0,0,0,0.18)] ring-1 ring-white/15 backdrop-blur-xl"
        animate={reduce ? undefined : { y: [0, -5, 0], opacity: [0.74, 1, 0.82] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {style.label}
      </motion.div>
    </div>
  );
}
