"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PlanEditor } from "@/components/admin/PlanEditor";
import { Plan, getPlans, savePlan } from "@/lib/admin";

export default function EntitlementsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const refresh = () => getPlans().then(setPlans);
  useEffect(() => { refresh(); }, []);
  return (
    <AdminLayout>
      <h1 className="mb-2 text-3xl font-semibold tracking-[-0.04em]">Global Entitlement Rules</h1>
      <p className="mb-5 font-medium text-slate-500">Edit plan-level feature flags and limits used by pricing packages.</p>
      <div className="grid gap-4">{plans.map((plan) => <PlanEditor key={plan.planId} plan={plan} onSave={async (next) => { await savePlan(next); refresh(); }} />)}</div>
    </AdminLayout>
  );
}
