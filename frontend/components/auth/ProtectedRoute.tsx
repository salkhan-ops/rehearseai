"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/signin");
      return;
    }
    if (adminOnly && !isAdmin) {
      setDenied(true);
      window.setTimeout(() => router.replace("/dashboard?admin=denied"), 900);
    }
  }, [adminOnly, isAdmin, loading, router, user]);

  if (loading || !user) return <div className="px-4 py-12 text-center font-semibold text-slate-600 dark:text-white/60">Checking access...</div>;
  if (adminOnly && !isAdmin) {
    return <div className="px-4 py-12 text-center font-semibold text-rose-600">{denied ? "You do not have admin access." : "Checking admin access..."}</div>;
  }
  return <>{children}</>;
}
