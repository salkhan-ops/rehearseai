"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const router = useRouter();
  const { user, profile, loading, isAdmin } = useAuth();
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/signin");
      return;
    }
    if (!profile?.ageConfirmed) {
      router.replace("/age-check");
      return;
    }
    if (adminOnly && !isAdmin) {
      setDenied(true);
    }
  }, [adminOnly, isAdmin, loading, profile?.ageConfirmed, router, user]);

  if (loading || !user) return <div className="px-4 py-12 text-center font-semibold text-slate-600 dark:text-white/60">Checking access...</div>;
  if (!profile?.ageConfirmed) return <div className="px-4 py-12 text-center font-semibold text-slate-600 dark:text-white/60">Checking age eligibility...</div>;
  if (profile?.status === "disabled" || profile?.status === "removed") {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <div className="rounded-[1.5rem] bg-amber-50 p-6 font-semibold text-amber-800 ring-1 ring-amber-100 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20">
          Your account has been suspended. Contact support if you think this is a mistake.
        </div>
      </div>
    );
  }
  if (adminOnly && !isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <div className="rounded-[1.5rem] bg-rose-50 p-6 font-semibold text-rose-700 ring-1 ring-rose-100">
          {denied ? "Admin access required." : "Checking admin access..."}
        </div>
        {denied && (
          <button onClick={() => router.push("/admin/bootstrap")} className="mt-4 rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">
            Bootstrap first admin
          </button>
        )}
      </div>
    );
  }
  return <>{children}</>;
}
