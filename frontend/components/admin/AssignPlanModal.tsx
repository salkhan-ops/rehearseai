"use client";

import { useState } from "react";
import type { AdminUser, Plan } from "@/lib/admin";
import { assignPlan } from "@/lib/admin";

export function AssignPlanModal({ user, plans, onClose, onAssigned }: { user: AdminUser | null; plans: Plan[]; onClose: () => void; onAssigned: () => void }) {
  const [planId, setPlanId] = useState("free");
  const [status, setStatus] = useState("active");
  if (!user) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="mx-auto my-8 w-full max-w-lg rounded-[1.5rem] bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-semibold tracking-[-0.04em]">Assign plan</h2>
        <p className="mt-2 font-medium text-slate-500">{user.email || user.uid}</p>
        <div className="mt-5 grid gap-3">
          <select value={planId} onChange={(event) => setPlanId(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold">
            {plans.map((plan) => <option key={plan.planId} value={plan.planId}>{plan.name}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold">
            {["active", "trialing", "past_due", "cancelled"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-2xl bg-slate-50 px-5 py-3 font-semibold ring-1 ring-slate-200">Cancel</button>
          <button onClick={async () => {
            const plan = plans.find((item) => item.planId === planId);
            if (plan) await assignPlan(user.uid, plan, status);
            onAssigned();
            onClose();
          }} className="rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">Assign</button>
        </div>
      </div>
    </div>
  );
}
