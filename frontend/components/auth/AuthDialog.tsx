"use client";

import { X } from "lucide-react";
import { AuthForm, type AuthMode } from "@/components/auth/AuthForm";

export function AuthDialog({
  mode,
  onClose,
  onModeChange,
  onAuthenticated,
}: {
  mode: AuthMode | null;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
  onAuthenticated?: () => void;
}) {
  if (!mode) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 px-4 py-5 backdrop-blur-md" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close authentication dialog" onClick={onClose} />
      <div className="relative w-full max-w-[32rem]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-white/85 text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:text-slate-950 dark:bg-slate-900/90 dark:text-white/70 dark:ring-white/10 dark:hover:text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <div className="max-h-[92vh] overflow-y-auto rounded-[1.5rem]">
          <AuthForm mode={mode} onModeChange={onModeChange} onAuthenticated={onAuthenticated} />
        </div>
      </div>
    </div>
  );
}
