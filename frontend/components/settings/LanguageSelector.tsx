"use client";

import { Languages } from "lucide-react";
import type { LanguageCode } from "@/lib/languages";

export function LanguageSelector({
  feedbackLanguage,
  onFeedbackLanguageChange,
  onPracticeLanguageChange,
  practiceLanguage,
  compact = false,
}: {
  feedbackLanguage: LanguageCode;
  onFeedbackLanguageChange: (language: LanguageCode) => void;
  onPracticeLanguageChange: (language: LanguageCode) => void;
  practiceLanguage: LanguageCode;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-[1.5rem] surface-low ${compact ? "p-4" : "p-5"}`}>
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary)]">
        <Languages size={16} /> Language mode
      </div>
      <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
        <div className="text-sm font-semibold text-secondary-token">
          Practice language
          <div className="mt-1.5 flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-primary-token">
            English
            <span className="text-xs font-medium text-tertiary-token">Active</span>
          </div>
        </div>
        <div className="text-sm font-semibold text-secondary-token">
          Feedback language
          <div className="mt-1.5 flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-primary-token">
            English
            <span className="text-xs font-medium text-tertiary-token">Active</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs font-medium leading-5 text-tertiary-token">
        Roleplay follows the practice language. Reports and coaching follow the feedback language. Other languages will follow.
      </p>
    </div>
  );
}
