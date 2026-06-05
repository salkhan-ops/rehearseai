"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Box, Camera, CreditCard, FileText, LayoutDashboard, ListChecks, LogOut, RefreshCw, Settings, ShieldCheck, Users } from "lucide-react";
import { AdminRoute } from "./AdminRoute";
import { useAuth } from "@/lib/auth";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const pathname = usePathname();
  const links = [
    ["/admin", "Dashboard", LayoutDashboard],
    ["/admin/users", "Users", Users],
    ["/admin/plans", "Plans", FileText],
    ["/admin/entitlements", "Entitlements", ShieldCheck],
    ["/admin/products", "Products", Box],
    ["/admin/practice-templates", "Practice Templates", ListChecks],
    ["/admin/course-templates", "Course Templates", BookOpen],
    ["/admin/billing", "Billing", CreditCard],
    ["/admin/logs", "Logs", FileText],
    ["/admin/local-signals", "Local Signals", Camera],
    ["/admin/settings", "Settings", Settings],
  ] as const;
  return (
    <main className="min-h-screen bg-[#eef4fb] px-4 py-6 text-slate-900">
      <AdminRoute>
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[17rem_1fr]">
          <aside className="rounded-[1.5rem] bg-white/92 p-3 shadow-[0_18px_50px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
            <Link href="/admin" className="block px-3 py-3 text-xl font-semibold tracking-[-0.03em]">RehearseAI Admin</Link>
            <nav className="mt-3 grid gap-1">
              {links.map(([href, label, Icon]) => {
                const active = pathname === href;
                return (
                  <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-[#6200a8] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
                    <Icon size={17} /> {label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <div>
          <div className="mb-5 flex items-center justify-between rounded-[1.5rem] bg-white/90 px-5 py-4 shadow-[0_18px_50px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75">
            <div>
              <div className="text-lg font-semibold tracking-[-0.03em]">Admin Console</div>
              <div className="text-sm font-medium text-slate-500">Firebase Auth role required: users/uid.role == admin</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.location.reload()} className="grid size-10 place-items-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-200"><RefreshCw size={17} /></button>
              <Link href="/admin/entitlements" className="grid size-10 place-items-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-200"><Settings size={17} /></Link>
              <button onClick={signOut} className="grid size-10 place-items-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-200"><LogOut size={17} /></button>
            </div>
          </div>
          {children}
          </div>
        </div>
      </AdminRoute>
    </main>
  );
}
