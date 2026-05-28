"use client";

import { Chrome } from "lucide-react";

export function GoogleSignInButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-50 px-5 py-3 font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-white disabled:opacity-60 dark:bg-white/10 dark:text-white/70 dark:ring-white/10"
    >
      <Chrome size={18} />
      Continue with Google
    </button>
  );
}
