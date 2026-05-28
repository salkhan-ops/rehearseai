"use client";

import { LucideIcon } from "lucide-react";

export function AdminStatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="rounded-[1.25rem] bg-white p-4 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      <div className="flex items-center justify-between gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-[#476bff]"><Icon size={19} /></div>
        <div className="text-3xl font-semibold tracking-[-0.045em] text-slate-900">{value}</div>
      </div>
      <div className="mt-4 text-sm font-semibold text-slate-500">{label}</div>
    </div>
  );
}
