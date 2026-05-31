"use client";

import type { AdminUser } from "@/lib/admin";

export function UserDetailPanel({ user }: { user: AdminUser | null }) {
  if (!user) return null;
  return (
    <aside className="rounded-[1.25rem] bg-white p-5 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      <h2 className="text-xl font-semibold tracking-[-0.03em]">User details</h2>
      {[
        ["UID", user.uid],
        ["Email", user.email || ""],
        ["Name", user.displayName || ""],
        ["Role", user.role || "user"],
        ["Plan", user.planName || user.planId || "Free"],
        ["Status", user.status || "active"],
      ].map(([label, value]) => (
        <div key={label} className="mt-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</div>
          <div className="mt-1 break-all font-semibold">{String(value)}</div>
        </div>
      ))}
    </aside>
  );
}
