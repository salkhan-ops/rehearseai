"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit } from "lucide-react";
import type { SessionHint } from "@/lib/types";

const tone: Record<string, string> = {
  reasoning: "from-blue-300/24 to-cyan-300/10 border-blue-200/35",
  evidence: "from-violet-300/24 to-fuchsia-300/10 border-violet-200/35",
  conciseness: "from-amber-300/24 to-orange-300/10 border-amber-200/35",
  stakeholder: "from-teal-300/24 to-cyan-300/10 border-teal-200/35",
  confidence: "from-emerald-300/24 to-lime-300/10 border-emerald-200/35",
  structure: "from-sky-300/24 to-blue-300/10 border-sky-200/35",
};

export function FloatingHint({ hint, onExpand }: { hint: SessionHint | null; onExpand: () => void }) {
  return (
    <AnimatePresence>
      {hint && (
        <motion.button
          type="button"
          onClick={onExpand}
          initial={{ opacity: 0, x: 70, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: [1, 1.025, 1] }}
          exit={{ opacity: 0, x: 40, scale: 0.98 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={`fixed right-4 top-32 z-40 max-w-xs rounded-[1.25rem] border bg-gradient-to-br ${tone[hint.hintType] || tone.reasoning} p-4 text-left text-white shadow-[0_18px_60px_rgba(34,211,238,0.16)] backdrop-blur-2xl`}
        >
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-[1.25rem] bg-white/10"
            animate={{ opacity: [0.1, 0.28, 0.1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/62"><BrainCircuit size={14} /> Reasoning hint</span>
          <span className="relative mt-2 block text-sm font-semibold leading-6">{hint.hintText}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
