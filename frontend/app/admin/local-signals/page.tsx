"use client";

import { useEffect, useState } from "react";
import { Activity, Camera, ShieldCheck } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/lib/auth";
import { getLocalSignalDiagnostics } from "@/lib/telemetry";

type Diagnostics = Awaited<ReturnType<typeof getLocalSignalDiagnostics>>;

export default function LocalSignalsAdminPage() {
  const { getToken } = useAuth();
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getToken()
      .then((token) => getLocalSignalDiagnostics(token))
      .then(setDiagnostics)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load local signal diagnostics."));
  }, [getToken]);

  return (
    <AdminLayout>
      <section className="rounded-[1.5rem] bg-white p-5 shadow-[0_18px_50px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#6200a8]">
          <Camera size={16} /> Local Signals
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Camera-assisted timing diagnostics</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
          Aggregate numeric timing signals only. This view does not contain video, images, frames, screenshots, or raw camera data.
        </p>
      </section>

      {error && <p className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p>}

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {[
          ["Records", diagnostics?.totalRecords || 0],
          ["Camera enabled", diagnostics?.cameraEnabledRecords || 0],
          ["Face detected", diagnostics?.faceDetectedRecords || 0],
          ["Opt outs", diagnostics?.optOutCount || 0],
          ["Camera toggles", diagnostics?.cameraToggleCount || 0],
          ["Toggled on", diagnostics?.cameraToggledOnCount || 0],
          ["Toggled off", diagnostics?.cameraToggledOffCount || 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[1.25rem] bg-white p-4 ring-1 ring-slate-200/75">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-[1.5rem] bg-white p-5 ring-1 ring-slate-200/75">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Activity size={18} /> Feature distributions</h2>
          <div className="mt-4 grid gap-2">
            {Object.entries(diagnostics?.averages || {}).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold">
                <span>{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-[1.5rem] bg-white p-5 ring-1 ring-slate-200/75">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck size={18} /> Decisions and proxy quality</h2>
          <div className="mt-4 grid gap-2">
            {Object.entries(diagnostics?.decisionCounts || {}).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold">
                <span>{label}</span>
                <span>{value}</span>
              </div>
            ))}
            {Object.entries(diagnostics?.accuracyProxy || {}).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                <span>{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
