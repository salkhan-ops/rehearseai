"use client";

import { useEffect, useState } from "react";
import { AdminUser, Plan, assignPlan, getPlans } from "@/lib/admin";

export function UserPlanAssignment({ user }: { user: AdminUser }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState(user.planId || "free");
  const [status, setStatus] = useState(user.status || "active");
  const [trialEndsAt, setTrialEndsAt] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getPlans().then(setPlans);
  }, []);

  async function save() {
    const plan = plans.find((item) => item.planId === planId);
    if (!plan || !user.uid) return;
    await assignPlan(user.uid, plan, status, {}, trialEndsAt);
    setSaved(true);
  }

  return (
    <div className="rounded-[1.25rem] bg-white p-5 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      <h3 className="text-xl font-semibold tracking-[-0.03em]">{user.email || user.uid}</h3>
      <p className="mt-1 text-sm font-medium text-slate-500">Current: {user.planName || "Free"} • {user.status || "active"}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none">
          {plans.map((plan) => <option key={plan.planId} value={plan.planId}>{plan.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none">
          {["active", "trialing", "past_due", "cancelled"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={trialEndsAt} onChange={(e) => setTrialEndsAt(e.target.value)} placeholder="trialEndsAt" className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
      </div>
      <button onClick={save} className="mt-4 rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">Assign plan</button>
      {saved && <span className="ml-3 text-sm font-semibold text-emerald-600">Saved</span>}
    </div>
  );
}
