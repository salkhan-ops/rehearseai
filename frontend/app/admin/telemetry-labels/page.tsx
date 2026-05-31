"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { exportTrainingData, getTelemetrySamples, saveTelemetryLabel, type TelemetrySample } from "@/lib/admin";

const pauseTypes = ["thinking", "finished", "confused", "abandoned"];
const userStates = ["calm", "hesitant", "confused", "defensive", "rushing", "overexplaining"];
const aiActionQualities = ["good", "too_early", "too_late", "too_soft", "too_hard"];

export default function AdminTelemetryLabelsPage() {
  const [samples, setSamples] = useState<TelemetrySample[]>([]);
  const [selected, setSelected] = useState<TelemetrySample | null>(null);
  const [pauseType, setPauseType] = useState("thinking");
  const [userState, setUserState] = useState("calm");
  const [aiActionQuality, setAiActionQuality] = useState("good");
  const [notes, setNotes] = useState("");
  const [exportText, setExportText] = useState("");

  function refresh() {
    getTelemetrySamples().then((items) => {
      setSamples(items);
      setSelected((current) => current || items[0] || null);
    }).catch(() => setSamples([]));
  }

  useEffect(() => { refresh(); }, []);

  async function submitLabel() {
    if (!selected) return;
    await saveTelemetryLabel({
      telemetryId: selected.telemetryId,
      labeledBy: "admin",
      labels: { pauseType, userState, aiActionQuality },
      notes,
    });
    setNotes("");
    refresh();
  }

  async function exportData(format: "jsonl" | "csv") {
    setExportText(await exportTrainingData(format));
  }

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Telemetry Labels</h1>
          <p className="mt-1 font-medium text-slate-500">Anonymized turn samples for future supervised classifiers.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportData("jsonl")} className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Export JSONL</button>
          <button onClick={() => exportData("csv")} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">Export CSV</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div className="space-y-3">
          {samples.map((sample) => (
            <button
              key={sample.telemetryId}
              onClick={() => setSelected(sample)}
              className={`w-full rounded-[1.25rem] p-4 text-left shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ${selected?.telemetryId === sample.telemetryId ? "bg-violet-50 ring-violet-200" : "bg-white ring-slate-200/75"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{sample.practiceType || "Practice"}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{sample.difficulty || "Realistic"}</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{sample.detectedUserState}</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{sample.detectedPauseType}</span>
              </div>
              <div className="mt-3 grid gap-2 text-sm font-medium text-slate-600 sm:grid-cols-4">
                <span>{sample.wordCount || 0} words</span>
                <span>{Math.round(sample.wordsPerMinute || 0)} wpm</span>
                <span>{Math.round((sample.fillerWordRate || 0) * 100)}% filler</span>
                <span>{sample.language || "en"}</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-400">{sample.anonymousUserId}</p>
            </button>
          ))}
          {!samples.length && <div className="rounded-[1.25rem] bg-white p-8 text-center font-semibold text-slate-500 ring-1 ring-slate-200">No telemetry samples found.</div>}
        </div>

        <aside className="rounded-[1.5rem] bg-white p-5 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
          <h2 className="text-xl font-semibold tracking-[-0.03em]">Label selected turn</h2>
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-semibold text-slate-600">Pause type
              <select value={pauseType} onChange={(event) => setPauseType(event.target.value)} className="mt-2 w-full rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                {pauseTypes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-600">User state
              <select value={userState} onChange={(event) => setUserState(event.target.value)} className="mt-2 w-full rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                {userStates.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-600">AI action quality
              <select value={aiActionQuality} onChange={(event) => setAiActionQuality(event.target.value)} className="mt-2 w-full rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                {aiActionQualities.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-600">Notes
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="mt-2 w-full resize-none rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200" />
            </label>
            <button onClick={submitLabel} disabled={!selected} className="w-full rounded-xl bg-[#6200a8] px-4 py-3 font-semibold text-white disabled:opacity-50">Save label</button>
          </div>
          {exportText && (
            <textarea readOnly value={exportText} rows={8} className="mt-4 w-full resize-none rounded-xl bg-slate-950 p-3 font-mono text-xs text-white" />
          )}
        </aside>
      </div>
    </AdminLayout>
  );
}
