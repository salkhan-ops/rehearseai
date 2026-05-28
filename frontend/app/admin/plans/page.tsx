"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PlanEditor } from "@/components/admin/PlanEditor";
import { Plan, defaultPlans, getPlans, savePlan, seedDefaultPlans } from "@/lib/admin";

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const refresh = () => getPlans().then(setPlans);
  useEffect(() => { refresh(); }, []);

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Plan Templates</h1>
          <p className="mt-1 font-medium text-slate-500">Pricing packages, Paddle IDs, and entitlement limits.</p>
        </div>
        <button onClick={async () => { await seedDefaultPlans(); refresh(); }} className="rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">Seed default plans</button>
      </div>
      <div className="grid gap-4">
        {(plans.length ? plans : defaultPlans).map((plan) => <PlanEditor key={plan.planId} plan={plan} onSave={async (next) => { await savePlan(next); refresh(); }} />)}
      </div>
    </AdminLayout>
  );
}
