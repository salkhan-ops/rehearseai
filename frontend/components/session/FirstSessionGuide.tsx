"use client";

import { useEffect, useState } from "react";
import { X, Zap, BarChart2, MessageSquare, Trophy } from "lucide-react";

const TIPS = [
  {
    icon: MessageSquare,
    title: "Speak naturally",
    body: "Type or speak as you would in the real situation. The AI evaluates your actual reasoning, not how you phrase the question.",
  },
  {
    icon: Zap,
    title: "Don't be safe",
    body: "Give direct answers, then defend them. Hedging and over-qualifying scores poorly — confidence and clarity are tracked.",
  },
  {
    icon: BarChart2,
    title: "15 metrics are scored",
    body: "Confidence, clarity, composure, persuasion, critical thinking, and 10 more. Your session report shows exactly where to improve.",
  },
  {
    icon: Trophy,
    title: "Progress tracked over time",
    body: "Every session feeds your progress chart. You'll see which skills are improving and which need more focus.",
  },
];

export function FirstSessionGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("rh_seen_guide")) {
        setOpen(true);
        localStorage.setItem("rh_seen_guide", "1");
      }
    } catch { /* ignore */ }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative mx-auto my-8 w-full max-w-lg rounded-[2rem] bg-[#0d0020] p-7 ring-1 ring-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.7)]">
        <button type="button" onClick={() => setOpen(false)}
          className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition"
          aria-label="Close guide">
          <X size={16} />
        </button>

        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Welcome to RehearseAI</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Your first session</h2>
          <p className="mt-2 text-sm text-white/60">Here's what you need to know to get the most out of your practice.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {TIPS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600/25">
                <Icon size={16} className="text-violet-300" />
              </div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="mt-1.5 text-xs leading-5 text-white/56">{body}</p>
            </div>
          ))}
        </div>

        <button type="button" onClick={() => setOpen(false)}
          className="mt-5 w-full rounded-2xl bg-violet-600 py-3 text-sm font-bold text-white transition hover:bg-violet-500 shadow-[0_8px_24px_rgba(98,0,168,0.4)]">
          Got it — let's begin
        </button>
      </div>
    </div>
  );
}
