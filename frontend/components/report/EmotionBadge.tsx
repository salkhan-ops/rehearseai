"use client";

const EMOTION_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  confident: { color: "text-emerald-300", bg: "bg-emerald-500/15", label: "Confident" },
  nervous: { color: "text-amber-300", bg: "bg-amber-500/15", label: "Nervous" },
  hesitant: { color: "text-orange-300", bg: "bg-orange-500/15", label: "Hesitant" },
  monotone: { color: "text-slate-300", bg: "bg-slate-500/15", label: "Monotone" },
  rushed: { color: "text-rose-300", bg: "bg-rose-500/15", label: "Rushed" },
  unclear: { color: "text-slate-400", bg: "bg-slate-500/10", label: "Unclear" },
};

type Props = {
  label: string;
  confidenceScore: number;
  wpm?: number;
};

export function EmotionBadge({ label, confidenceScore, wpm }: Props) {
  const cfg = EMOTION_CONFIG[label] ?? EMOTION_CONFIG.unclear;
  const pct = Math.round(confidenceScore * 100);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color} ring-1 ring-inset ring-current/20`}>
      {cfg.label}
      <span className="opacity-60">{pct}%</span>
      {wpm != null && wpm > 0 && <span className="opacity-50">· {wpm} wpm</span>}
    </span>
  );
}
