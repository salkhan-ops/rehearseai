"use client";

import { Mic, Waves } from "lucide-react";
import type { ConversationMode } from "@/lib/types";

export function ConversationModeToggle({
  value,
  onChange,
  disabled = false,
  compact = false,
}: {
  value: ConversationMode;
  onChange: (mode: ConversationMode) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "grid gap-2" : "grid gap-2"}>
      <div className="text-sm font-semibold text-slate-700 dark:text-white/75">Conversation Style</div>
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("manual")}
          className={`min-h-12 rounded-2xl px-4 py-3 text-left text-sm font-semibold ring-1 transition disabled:opacity-50 ${value === "manual" ? "bg-slate-950 text-white ring-slate-950 dark:bg-white dark:text-slate-950 dark:ring-white" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:text-white/70 dark:ring-white/10"}`}
        >
          <span className="flex items-center gap-2"><Mic size={16} /> Manual</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("natural")}
          className={`min-h-12 rounded-2xl px-4 py-3 text-left text-sm font-semibold ring-1 transition disabled:opacity-50 ${value === "natural" ? "bg-cyan-200 text-slate-950 ring-cyan-100 shadow-[0_14px_34px_rgba(125,211,252,0.18)]" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:text-white/70 dark:ring-white/10"}`}
        >
          <span className="flex items-center gap-2"><Waves size={16} /> Natural Conversation</span>
        </button>
      </div>
    </div>
  );
}
