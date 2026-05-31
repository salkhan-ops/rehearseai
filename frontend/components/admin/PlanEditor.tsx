"use client";

import { useState } from "react";
import { EntitlementEditor } from "./EntitlementEditor";
import type { Plan } from "@/lib/admin";

export function PlanEditor({ plan, onSave }: { plan: Plan; onSave: (plan: Plan) => Promise<void> }) {
  const [draft, setDraft] = useState(plan);
  const [saving, setSaving] = useState(false);
  return (
    <div className="rounded-[1.25rem] bg-white p-5 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      <div className="grid gap-3 md:grid-cols-3">
        <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
        <input value={draft.priceMonthly} type="number" onChange={(e) => setDraft({ ...draft, priceMonthly: Number(e.target.value) })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
        <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 font-semibold text-slate-700 ring-1 ring-slate-200">
          <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} className="accent-[#6200a8]" /> Active
        </label>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <input value={draft.slug || draft.planId} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="slug" />
        <input value={draft.priceYearly} type="number" onChange={(e) => setDraft({ ...draft, priceYearly: Number(e.target.value) })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="yearly price" />
        <input value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="USD" />
        <input value={draft.sortOrder} type="number" onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="sort" />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <input value={draft.paddleProductId} onChange={(e) => setDraft({ ...draft, paddleProductId: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="Paddle product ID" />
        <input value={draft.paddleMonthlyPriceId} onChange={(e) => setDraft({ ...draft, paddleMonthlyPriceId: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="Monthly price ID" />
        <input value={draft.paddleYearlyPriceId} onChange={(e) => setDraft({ ...draft, paddleYearlyPriceId: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="Yearly price ID" />
        <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 font-semibold text-slate-700 ring-1 ring-slate-200">
          <input type="checkbox" checked={draft.isPublic ?? true} onChange={(e) => setDraft({ ...draft, isPublic: e.target.checked })} className="accent-[#6200a8]" /> Public
        </label>
      </div>
      <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none" />
      <div className="mt-4"><EntitlementEditor value={draft.entitlements} onChange={(entitlements) => setDraft({ ...draft, entitlements })} /></div>
      <button onClick={async () => { setSaving(true); await onSave(draft); setSaving(false); }} className="mt-4 rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">
        {saving ? "Saving..." : "Save plan"}
      </button>
    </div>
  );
}
