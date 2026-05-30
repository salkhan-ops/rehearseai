import { ShieldAlert } from "lucide-react";

export function AIDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-[1.5rem] surface-low ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 shrink-0 text-[var(--accent-primary)]" size={20} />
        <div>
          <p className="font-semibold text-primary-token">AI practice disclaimer</p>
          <p className="mt-1 text-sm font-medium leading-6 text-secondary-token">
            RehearseAI provides AI-generated simulations and feedback for practice purposes only. It does not guarantee interview, job, business, academic, or personal outcomes and is not legal, medical, mental health, or other professional advice.
          </p>
        </div>
      </div>
    </div>
  );
}
