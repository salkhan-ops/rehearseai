"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PlanEditor } from "@/components/admin/PlanEditor";
import { Plan, defaultPlans, getPlans, savePlan, seedDefaultPlans } from "@/lib/admin";

type Status = { type: "success" | "error"; message: string } | null;

const blankPlan: Plan = {
  planId: "new-plan",
  slug: "new-plan",
  name: "New Plan",
  description: "",
  priceMonthly: 0,
  priceYearly: 0,
  currency: "GBP",
  paddleProductId: "",
  paddleMonthlyPriceId: "",
  paddleYearlyPriceId: "",
  isActive: true,
  isPublic: false,
  sortOrder: 99,
  entitlements: defaultPlans[0].entitlements,
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<Status>(null);
  const [fromFirestore, setFromFirestore] = useState(false);

  async function refresh() {
    try {
      const fetched = await getPlans();
      setPlans(fetched);
      setFromFirestore(true);
    } catch (e) {
      console.error("[plans fetch]", e);
      setFromFirestore(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function handleSeed() {
    setSeeding(true);
    setSeedStatus(null);
    try {
      await seedDefaultPlans();
      await refresh();
      setSeedStatus({ type: "success", message: "3 plans written to Firestore." });
    } catch (e) {
      setSeedStatus({ type: "error", message: e instanceof Error ? e.message : "Seed failed — check console." });
      console.error("[seed plans]", e);
    } finally {
      setSeeding(false);
    }
  }

  async function handleCreate() {
    try {
      await savePlan(blankPlan);
      await refresh();
    } catch (e) {
      console.error("[create plan]", e);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Plan Templates</h1>
          <p className="mt-1 font-medium text-slate-500">Pricing packages, Paddle IDs, and entitlement limits.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {seedStatus && (
            <span className={`flex items-center gap-1.5 text-sm font-semibold ${seedStatus.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
              {seedStatus.type === "success" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              {seedStatus.message}
            </span>
          )}
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-2xl bg-white px-5 py-3 font-semibold text-slate-700 ring-1 ring-slate-200"
          >
            Create plan
          </button>
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white disabled:opacity-60"
          >
            {seeding && <Loader2 size={15} className="animate-spin" />}
            {seeding ? "Seeding…" : "Seed default plans"}
          </button>
        </div>
      </div>

      {!fromFirestore && plans.length === 0 && (
        <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
          Showing code defaults — not yet saved to Firestore. Click &quot;Seed default plans&quot; to persist them.
        </div>
      )}

      <div className="grid gap-4">
        {(plans.length ? plans : defaultPlans).map((plan) => (
          <PlanEditor
            key={plan.planId}
            plan={plan}
            onSave={async (next) => {
              await savePlan(next);
              await refresh();
            }}
          />
        ))}
      </div>
    </AdminLayout>
  );
}
