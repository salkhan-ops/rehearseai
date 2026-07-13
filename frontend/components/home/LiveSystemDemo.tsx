"use client";

import { motion } from "framer-motion";
import { GitBranch, Waves } from "lucide-react";
import { AnimatedSection } from "@/components/animations";

// Split into its own file and dynamic-imported (see app/page.tsx) so this section's JS --
// including 42 continuously-animated bars -- isn't part of the bundle that must be
// downloaded/parsed/hydrated before the hero CTA above it becomes interactive. The bars
// themselves use CSS keyframes (.pressure-bar in globals.css) rather than framer-motion,
// since running 42 concurrent JS-driven animations is expensive on low-power mobile even
// once it's off the critical path.
export function LiveSystemDemo() {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <AnimatedSection className="rounded-[2rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl">
        <div className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-cyan-100"><GitBranch size={18} /> Decision path expanding</div>
        <div className="relative mt-8 h-80">
          {["Main answer", "Evidence path", "Generic path", "Defensive path", "Executive framing"].map((label, index) => (
            <motion.div
              key={label}
              className="absolute rounded-full bg-white/80 dark:bg-white/[0.09] px-4 py-2 text-sm font-semibold text-slate-700 dark:text-white/76 ring-1 ring-slate-200/80 dark:ring-white/10"
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
        <p className="mt-4 text-sm font-medium text-slate-400 dark:text-white/38">
          <em>Executive framing:</em> how to restate the same answer at the level of risk, outcome, and decision — without changing the facts.
        </p>
      </AnimatedSection>
      <AnimatedSection className="rounded-[2rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl">
        <div className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-cyan-100"><Waves size={18} /> Pressure response field</div>
        <div className="mt-8 flex h-72 items-center gap-2">
          {Array.from({ length: 42 }).map((_, index) => (
            <span
              key={index}
              className="pressure-bar w-full rounded-full bg-gradient-to-t from-violet-500 via-cyan-300 to-white"
              style={{
                "--bar-h-1": `${24 + ((index * 11) % 56)}%`,
                "--bar-h-2": `${38 + ((index * 17) % 58)}%`,
                "--bar-h-3": `${22 + ((index * 7) % 48)}%`,
                "--bar-o": 0.26 + (index % 6) * 0.09,
                "--bar-dur": `${2.6 + (index % 5) * 0.12}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </AnimatedSection>
    </div>
  );
}
