"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { claimFirstAdmin, getAdminBootstrapStatus } from "@/lib/admin";
import { useAuth } from "@/lib/auth";

export default function AdminBootstrapPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<{ adminExists: boolean; firstAdminEmailConfigured: boolean } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminBootstrapStatus().then(setStatus).catch(() => setError("Could not load bootstrap status. Make sure the backend is running."));
  }, []);

  async function claim() {
    if (!user) return;
    setError("");
    setMessage("Promoting your account...");
    try {
      await claimFirstAdmin({ uid: user.uid, email: user.email || profile?.email || "" });
      setMessage("Admin role granted. Refreshing access...");
      window.setTimeout(() => router.push("/admin"), 700);
    } catch (caught) {
      setMessage("");
      setError(caught instanceof Error ? caught.message : "Could not claim admin access.");
    }
  }

  return (
    <main className="min-h-screen bg-[#eef4fb] px-4 py-12 text-slate-900">
      <ProtectedRoute>
        <section className="mx-auto max-w-xl rounded-[1.75rem] bg-white p-7 shadow-[0_18px_55px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#6200a8]">Admin bootstrap</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">Claim first admin</h1>
          <p className="mt-3 font-medium leading-7 text-slate-600">
            This only works before any admin exists. If `FIRST_ADMIN_EMAIL` is configured, your signed-in email must match it.
          </p>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
            <div>Signed in as: {user?.email || profile?.email || user?.uid}</div>
            <div>Admin exists: {status ? String(status.adminExists) : "checking..."}</div>
            <div>FIRST_ADMIN_EMAIL configured: {status ? String(status.firstAdminEmailConfigured) : "checking..."}</div>
          </div>
          <button disabled={!status || status.adminExists} onClick={claim} className="mt-5 w-full rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white disabled:opacity-50">
            Claim admin access
          </button>
          {message && <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}
          {error && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
        </section>
      </ProtectedRoute>
    </main>
  );
}
