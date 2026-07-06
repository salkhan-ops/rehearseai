"use client";

export function PreviewBadge({ label = "Preview data — connect API" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-amber-600 ring-1 ring-amber-100">
      {label}
    </span>
  );
}
