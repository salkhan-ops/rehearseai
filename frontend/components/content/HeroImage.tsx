"use client";

import { motion } from "framer-motion";

export function HeroImage({ seed = "cognition", className = "" }: { seed?: string; className?: string }) {
  const offset = seed.length % 5;
  return (
    <div className={`relative overflow-hidden rounded-[2rem] surface-high ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgba(34,211,238,0.25),transparent_28%),radial-gradient(circle_at_78%_70%,rgba(139,92,246,0.25),transparent_30%)]" />
      <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 900 520" fill="none" aria-hidden="true">
        {Array.from({ length: 7 }).map((_, index) => (
          <motion.path
            key={index}
            d={`M${70 + index * 45} ${120 + ((index + offset) % 4) * 42} C ${250 + index * 20} ${30 + index * 28}, ${440 - index * 12} ${360 - index * 22}, ${780 - index * 28} ${160 + index * 31}`}
            stroke="url(#heroLine)"
            strokeWidth="2"
            strokeDasharray="7 12"
            animate={{ pathLength: [0.2, 1, 0.2], opacity: [0.24, 0.76, 0.3] }}
            transition={{ duration: 5 + index * 0.3, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        <defs>
          <linearGradient id="heroLine" x1="80" x2="780" y1="80" y2="420">
            <stop stopColor="#67e8f9" />
            <stop offset="0.55" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative grid min-h-[260px] place-items-center md:min-h-[420px]">
        <motion.div
          className="h-40 w-40 rounded-full bg-gradient-to-br from-cyan-200 via-violet-300 to-blue-400 blur-sm shadow-[0_0_110px_rgba(99,102,241,0.42)] md:h-56 md:w-56"
          animate={{ scale: [1, 1.08, 1], rotate: [0, 16, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)]/50 via-transparent to-transparent" />
    </div>
  );
}
