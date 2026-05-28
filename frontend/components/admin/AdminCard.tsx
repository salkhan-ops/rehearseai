"use client";

import Link from "next/link";
import { ChevronRight, LucideIcon } from "lucide-react";

export function AdminCard({ href, icon: Icon, title, subtitle, badge }: { href: string; icon: LucideIcon; title: string; subtitle: string; badge?: string | number }) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-[1.25rem] bg-white p-4 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75 transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(35,45,75,0.08)]">
      <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-[#476bff]"><Icon size={20} /></div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold tracking-[-0.02em] text-slate-900">{title}</h3>
          {badge !== undefined && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{badge}</span>}
        </div>
        <p className="mt-1 text-sm font-medium leading-5 text-slate-500">{subtitle}</p>
      </div>
      <ChevronRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#476bff]" size={20} />
    </Link>
  );
}
