"use client";

import type { Entitlements } from "@/lib/admin";

export function EntitlementEditor({ value, onChange }: { value: Entitlements; onChange: (next: Entitlements) => void }) {
  const entries = Object.entries(value);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {entries.map(([key, item]) => (
        <label key={key} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <span className="block text-xs font-semibold text-slate-500">{key}</span>
          {typeof item === "boolean" ? (
            <input type="checkbox" checked={item} onChange={(event) => onChange({ ...value, [key]: event.target.checked })} className="mt-3 size-5 accent-[#6200a8]" />
          ) : (
            <input value={String(item)} onChange={(event) => {
              const raw = event.target.value;
              onChange({ ...value, [key]: raw === "unlimited" ? "unlimited" : Number.isNaN(Number(raw)) ? raw : Number(raw) });
            }} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none" />
          )}
        </label>
      ))}
    </div>
  );
}
