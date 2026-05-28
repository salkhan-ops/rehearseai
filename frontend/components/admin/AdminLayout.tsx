"use client";

import Link from "next/link";
import { LogOut, RefreshCw, Settings } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  return (
    <main className="min-h-screen bg-[#eef4fb] px-4 py-6 text-slate-900">
      <ProtectedRoute adminOnly>
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex items-center justify-between rounded-[1.5rem] bg-white/90 px-5 py-4 shadow-[0_18px_50px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75">
            <Link href="/admin" className="text-xl font-semibold tracking-[-0.03em]">Admin Console</Link>
            <div className="flex items-center gap-2">
              <button onClick={() => window.location.reload()} className="grid size-10 place-items-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-200"><RefreshCw size={17} /></button>
              <Link href="/admin/entitlements" className="grid size-10 place-items-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-200"><Settings size={17} /></Link>
              <button onClick={signOut} className="grid size-10 place-items-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-200"><LogOut size={17} /></button>
            </div>
          </div>
          {children}
        </div>
      </ProtectedRoute>
    </main>
  );
}
