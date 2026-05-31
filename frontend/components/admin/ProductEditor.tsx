"use client";

import { useState } from "react";
import type { Product } from "@/lib/admin";

function listFromText(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

export function ProductEditor({ product, onSave }: { product: Product; onSave: (product: Product) => Promise<void> }) {
  const [draft, setDraft] = useState(product);
  const [saving, setSaving] = useState(false);
  return (
    <div className="rounded-[1.25rem] bg-white p-5 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      <div className="grid gap-3 md:grid-cols-3">
        <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="Title" />
        <input value={draft.productId} onChange={(e) => setDraft({ ...draft, productId: e.target.value, slug: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="product-id" />
        <input value={draft.priceDisplay} onChange={(e) => setDraft({ ...draft, priceDisplay: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="$19/mo" />
      </div>
      <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none" placeholder="Description" />
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="category" />
        <input value={draft.linkedPlanId} onChange={(e) => setDraft({ ...draft, linkedPlanId: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="linked plan" />
        <input value={draft.linkedTemplateId || ""} onChange={(e) => setDraft({ ...draft, linkedTemplateId: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="linked template" />
        <input value={draft.badgeText} onChange={(e) => setDraft({ ...draft, badgeText: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="badge" />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <textarea value={draft.benefits.join("\n")} onChange={(e) => setDraft({ ...draft, benefits: listFromText(e.target.value) })} className="rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none" placeholder="Benefits, one per line" />
        <textarea value={draft.limitations.join("\n")} onChange={(e) => setDraft({ ...draft, limitations: listFromText(e.target.value) })} className="rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none" placeholder="Limitations, one per line" />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <input value={draft.ctaText} onChange={(e) => setDraft({ ...draft, ctaText: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="CTA text" />
        <input value={draft.ctaUrl} onChange={(e) => setDraft({ ...draft, ctaUrl: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="/pricing" />
        <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 font-semibold text-slate-700 ring-1 ring-slate-200"><input type="checkbox" checked={draft.isPublic} onChange={(e) => setDraft({ ...draft, isPublic: e.target.checked })} /> Public</label>
        <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 font-semibold text-slate-700 ring-1 ring-slate-200"><input type="checkbox" checked={draft.isFeatured} onChange={(e) => setDraft({ ...draft, isFeatured: e.target.checked })} /> Featured</label>
      </div>
      <button onClick={async () => { setSaving(true); await onSave(draft); setSaving(false); }} className="mt-4 rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">{saving ? "Saving..." : "Save product"}</button>
    </div>
  );
}
