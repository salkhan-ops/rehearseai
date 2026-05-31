"use client";

import type { AdminLog } from "@/lib/admin";

export function AdminLogTable({ logs }: { logs: AdminLog[] }) {
  return (
    <div className="overflow-hidden rounded-[1.25rem] bg-white shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      {logs.map((log) => (
        <div key={log.logId} className="grid gap-3 border-b border-slate-100 p-4 last:border-0 md:grid-cols-[1fr_1fr_1fr_1.2fr]">
          <div className="font-semibold">{log.action}</div>
          <div className="text-sm font-medium text-slate-500">{log.targetType}: {log.targetId}</div>
          <div className="text-sm font-medium text-slate-500">{log.adminEmail || log.adminUid}</div>
          <div className="text-sm font-medium text-slate-500">{new Date(log.createdAt).toLocaleString()}</div>
        </div>
      ))}
      {!logs.length && <div className="p-8 text-center font-semibold text-slate-500">No admin logs yet.</div>}
    </div>
  );
}
