"use client";

import { useState } from "react";
import type { PracticeTemplate } from "@/lib/admin";
import { practiceTypes } from "@/lib/types";

const lines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);

export function PracticeTemplateEditor({ template, onSave }: { template: PracticeTemplate; onSave: (template: PracticeTemplate) => Promise<void> }) {
  const [draft, setDraft] = useState(template);
  const [saving, setSaving] = useState(false);
  return (
    <div className="rounded-[1.25rem] bg-white p-5 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      <div className="grid gap-3 md:grid-cols-4">
        <input title="Title" placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
        <input title="Template ID" placeholder="Template ID" value={draft.templateId} onChange={(e) => setDraft({ ...draft, templateId: e.target.value, slug: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
        <select value={draft.practiceType} onChange={(e) => setDraft({ ...draft, practiceType: e.target.value })} title="Practice type" className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none">
          {practiceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input title="Difficulty" placeholder="Difficulty" value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
      </div>
      <textarea title="Description" placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none" />
      <textarea title="Scenario prompt" placeholder="Scenario prompt" value={draft.scenarioPrompt} onChange={(e) => setDraft({ ...draft, scenarioPrompt: e.target.value })} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none" />
      <div className="mt-3 grid gap-3 md:grid-cols-5">
        <input title="Category" placeholder="Category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
        <input type="number" title="Default duration (minutes)" placeholder="Duration (min)" value={draft.defaultDurationMinutes} onChange={(e) => setDraft({ ...draft, defaultDurationMinutes: Number(e.target.value) })} onWheel={(e) => e.currentTarget.blur()} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
        <label className="rounded-2xl bg-slate-50 px-4 py-3 font-semibold ring-1 ring-slate-200"><input type="checkbox" checked={draft.beginnerBriefingEnabled} onChange={(e) => setDraft({ ...draft, beginnerBriefingEnabled: e.target.checked })} /> Briefing</label>
        <label className="rounded-2xl bg-slate-50 px-4 py-3 font-semibold ring-1 ring-slate-200"><input type="checkbox" checked={draft.conversationMapEnabled} onChange={(e) => setDraft({ ...draft, conversationMapEnabled: e.target.checked })} /> Map</label>
        <label className="rounded-2xl bg-slate-50 px-4 py-3 font-semibold ring-1 ring-slate-200"><input type="checkbox" checked={draft.hintsEnabled} onChange={(e) => setDraft({ ...draft, hintsEnabled: e.target.checked })} /> Hints</label>
      </div>
      <textarea value={draft.requiredEntitlements.join("\n")} onChange={(e) => setDraft({ ...draft, requiredEntitlements: lines(e.target.value) })} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none" placeholder="Required entitlements" />
      <div className="mt-3 flex flex-wrap gap-3">
        <label className="rounded-2xl bg-slate-50 px-4 py-3 font-semibold ring-1 ring-slate-200"><input type="checkbox" checked={draft.isPublic} onChange={(e) => setDraft({ ...draft, isPublic: e.target.checked })} /> Public</label>
        <label className="rounded-2xl bg-slate-50 px-4 py-3 font-semibold ring-1 ring-slate-200"><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /> Active</label>
      </div>
      <button onClick={async () => { setSaving(true); await onSave(draft); setSaving(false); }} className="mt-4 rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">{saving ? "Saving..." : "Save template"}</button>
    </div>
  );
}
