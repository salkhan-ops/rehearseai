"use client";

import { useState } from "react";
import type { CourseTemplateAdmin } from "@/lib/admin";

const lines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);

export function CourseTemplateEditor({ template, onSave }: { template: CourseTemplateAdmin; onSave: (template: CourseTemplateAdmin) => Promise<void> }) {
  const [draft, setDraft] = useState(template);
  const [saving, setSaving] = useState(false);
  return (
    <div className="rounded-[1.25rem] bg-white p-5 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      <div className="grid gap-3 md:grid-cols-4">
        <input title="Title" placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
        <input title="Template ID / slug" placeholder="Template ID / slug" value={draft.templateId} onChange={(e) => setDraft({ ...draft, templateId: e.target.value, slug: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
        <input type="number" title="Duration (days)" placeholder="Duration (days)" value={draft.durationDays} onChange={(e) => setDraft({ ...draft, durationDays: Number(e.target.value), durationLabel: `${Number(e.target.value)} days` })} onWheel={(e) => e.currentTarget.blur()} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
        <input title="Difficulty" placeholder="Difficulty" value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
      </div>
      <textarea title="Description" placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none" />
      <textarea title="Expected transformation" placeholder="Expected transformation" value={draft.expectedTransformation} onChange={(e) => setDraft({ ...draft, expectedTransformation: e.target.value })} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none" />
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <input title="Category" placeholder="Category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
        <input title="Frequency" placeholder="Frequency" value={draft.frequency} onChange={(e) => setDraft({ ...draft, frequency: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
        <input type="number" title="Daily minutes" placeholder="Daily minutes" value={draft.dailyMinutes} onChange={(e) => setDraft({ ...draft, dailyMinutes: Number(e.target.value) })} onWheel={(e) => e.currentTarget.blur()} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
        <input title="Schedule pattern" placeholder="Schedule pattern" value={draft.schedulePattern} onChange={(e) => setDraft({ ...draft, schedulePattern: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <textarea title="Target skills (one per line)" placeholder="Target skills (one per line)" value={draft.targetSkills.join("\n")} onChange={(e) => setDraft({ ...draft, targetSkills: lines(e.target.value) })} className="rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none" />
        <textarea title="Milestones (one per line)" placeholder="Milestones (one per line)" value={draft.milestones.join("\n")} onChange={(e) => setDraft({ ...draft, milestones: lines(e.target.value) })} className="rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none" />
        <textarea title="Required entitlements (one per line)" placeholder="Required entitlements (one per line)" value={draft.requiredEntitlements.join("\n")} onChange={(e) => setDraft({ ...draft, requiredEntitlements: lines(e.target.value) })} className="rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none" />
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <label className="rounded-2xl bg-slate-50 px-4 py-3 font-semibold ring-1 ring-slate-200"><input type="checkbox" checked={draft.isPublic} onChange={(e) => setDraft({ ...draft, isPublic: e.target.checked })} /> Public</label>
        <label className="rounded-2xl bg-slate-50 px-4 py-3 font-semibold ring-1 ring-slate-200"><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /> Active</label>
      </div>
      <button onClick={async () => { setSaving(true); await onSave(draft); setSaving(false); }} className="mt-4 rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">{saving ? "Saving..." : "Save course template"}</button>
    </div>
  );
}
