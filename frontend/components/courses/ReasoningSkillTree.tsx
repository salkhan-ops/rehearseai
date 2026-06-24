"use client";

import { motion } from "framer-motion";
import { Brain, Lock, Sparkles } from "lucide-react";

export function ReasoningSkillTree({ skills, growth }: { skills: string[]; growth?: Record<string, number | string> }) {
  const score = Math.max(0, Math.min(100, Number(growth?.reasoning || 0)));
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(139,92,246,0.24),transparent_30%)]" />
      <div className="relative">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100/60">Reasoning skill map</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Cognitive strength tree</h2>
        <div className="mt-5 h-2 rounded-full bg-white/10">
          <motion.div className="h-2 rounded-full bg-gradient-to-r from-cyan-200 via-violet-300 to-blue-300" initial={{ width: 0 }} whileInView={{ width: `${score}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {skills.map((skill, index) => {
            const unlocked = index < Math.max(2, Math.ceil((score || 22) / 18));
            return (
              <motion.div
                key={skill}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className={`rounded-2xl p-4 ring-1 ${unlocked ? "bg-white/10 ring-cyan-100/15" : "bg-white/[0.04] ring-white/10"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-cyan-100">{unlocked ? <Brain size={18} /> : <Lock size={18} />}</span>
                  {unlocked && <Sparkles size={16} className="text-violet-200" />}
                </div>
                <div className="mt-4 text-lg font-semibold tracking-[-0.03em]">{skill}</div>
                <p className="mt-2 text-sm font-medium leading-6 text-white/52">{unlocked ? "Active training focus" : "Unlocks as consistency improves"}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
