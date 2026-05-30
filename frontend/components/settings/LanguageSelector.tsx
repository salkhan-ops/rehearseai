"use client";

import { Languages } from "lucide-react";
import { supportedLanguages, type LanguageCode } from "@/lib/languages";

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
  const fieldClass = "w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-primary-token outline-none";

  return (
    <div className={`rounded-[1.5rem] surface-low ${compact ? "p-4" : "p-5"}`}>
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary)]">
        <Languages size={16} /> Language mode
      </div>
      <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
        <label className="text-sm font-semibold text-secondary-token">
          Practice language
          <select value={practiceLanguage} onChange={(event) => onPracticeLanguageChange(event.target.value as LanguageCode)} className={fieldClass}>
            {supportedLanguages.map((language) => (
              <option key={language.code} value={language.code}>{language.displayName} · {language.nativeName}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-secondary-token">
          Feedback language
          <select value={feedbackLanguage} onChange={(event) => onFeedbackLanguageChange(event.target.value as LanguageCode)} className={fieldClass}>
            {supportedLanguages.map((language) => (
              <option key={language.code} value={language.code}>{language.displayName} · {language.nativeName}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs font-medium leading-5 text-tertiary-token">
        Roleplay follows the practice language. Reports and coaching follow the feedback language.
      </p>
    </div>
  );
}
