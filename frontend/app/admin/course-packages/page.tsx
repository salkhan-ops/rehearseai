"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { defaultCoursePackages, getCoursePackages, saveCoursePackage, seedDefaultCoursePackages, type CoursePackage } from "@/lib/admin";

type Status = { type: "success" | "error"; message: string } | null;

function DurationPriceIds({ packages, onApply }: {
  packages: CoursePackage[];
  onApply: (updated: CoursePackage[]) => Promise<void>;
}) {
  const [id7, setId7] = useState("");
  const [id14, setId14] = useState("");
  const [id21, setId21] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function apply() {
    if (!id7 && !id14 && !id21) return;
    setSaving(true);
    setStatus(null);
    try {
      const updated = packages.map((pkg) => {
        if (pkg.durationDays === 7 && id7) return { ...pkg, paddlePriceId: id7 };
        if (pkg.durationDays === 14 && id14) return { ...pkg, paddlePriceId: id14 };
        if (pkg.durationDays === 21 && id21) return { ...pkg, paddlePriceId: id21 };
        return pkg;
      });
      await onApply(updated);
      setStatus({ type: "success", message: "Price IDs applied to all matching packages." });
    } catch (e) {
      setStatus({ type: "error", message: e instanceof Error ? e.message : "Failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-6 rounded-[1.25rem] bg-white p-5 ring-1 ring-slate-200/75 shadow-[0_14px_38px_rgba(35,45,75,0.045)]">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#6200a8]">Paddle Price IDs — set by duration</p>
      <p className="mt-1 text-sm font-medium text-slate-500">
        Paste one price ID per tier. All packages of that duration will be updated at once.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">7-day price ID ($29)</label>
          <input
            value={id7}
            onChange={(e) => setId7(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none"
            placeholder="pri_01..."
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">14-day price ID ($59)</label>
          <input
            value={id14}
            onChange={(e) => setId14(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none"
            placeholder="pri_01..."
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">21-day price ID ($89)</label>
          <input
            value={id21}
            onChange={(e) => setId21(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none"
            placeholder="pri_01..."
          />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={apply}
          disabled={saving || (!id7 && !id14 && !id21)}
          className="flex items-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving…" : "Apply to all packages"}
        </button>
        {status && (
          <span className={`flex items-center gap-1.5 text-sm font-semibold ${status.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
            {status.type === "success" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {status.message}
          </span>
        )}
      </div>
    </div>
  );
}

function PackageEditor({ pkg, onSave }: { pkg: CoursePackage; onSave: (p: CoursePackage) => Promise<void> }) {
  const [draft, setDraft] = useState(pkg);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setDraft(pkg); }, [pkg]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await onSave(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[1.25rem] bg-white p-5 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{pkg.durationDays} days</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">${pkg.price}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{pkg.practiceType}</span>
        {pkg.paddlePriceId && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-100">
            Paddle ✓
          </span>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <input value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="Title" />
        <input value={draft.packageId ?? ""} onChange={(e) => setDraft({ ...draft, packageId: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="package-id" />
        <select title="Stake level" value={draft.stakeLevel ?? "medium"} onChange={(e) => setDraft({ ...draft, stakeLevel: e.target.value as CoursePackage["stakeLevel"] })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none">
          <option value="high">High stakes</option>
          <option value="medium">Medium stakes</option>
          <option value="low">Low stakes</option>
        </select>
      </div>
      <textarea value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none" rows={2} placeholder="Description" />
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <input value={draft.practiceType ?? ""} onChange={(e) => setDraft({ ...draft, practiceType: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="Practice type" />
        <input value={draft.durationDays ?? 7} type="number" onChange={(e) => setDraft({ ...draft, durationDays: Number(e.target.value), sessionsIncluded: Number(e.target.value) })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="Days" />
        <input value={draft.price ?? 0} type="number" onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="Price ($)" />
        <input value={draft.paddlePriceId ?? ""} onChange={(e) => setDraft({ ...draft, paddlePriceId: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none" placeholder="pri_01... (auto-filled above)" />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 font-semibold text-slate-700 ring-1 ring-slate-200">
          <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} className="accent-[#6200a8]" /> Active
        </label>
        <input value={draft.sortOrder ?? 0} type="number" onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })} className="w-24 rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" placeholder="Sort" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white disabled:opacity-60">
          {saving && <Loader2 size={15} className="animate-spin" />}
          {saving ? "Saving…" : "Save package"}
        </button>
        {saved && <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><CheckCircle2 size={15} /> Saved</span>}
        {error && <span className="flex items-center gap-1.5 text-sm font-semibold text-rose-600"><XCircle size={15} /> {error}</span>}
      </div>
    </div>
  );
}

export default function CoursePackagesAdminPage() {
  const [packages, setPackages] = useState<CoursePackage[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<Status>(null);
  const [fromFirestore, setFromFirestore] = useState(false);

  async function refresh() {
    try {
      const pkgs = await getCoursePackages();
      setPackages(pkgs);
      setFromFirestore(true);
    } catch {
      setFromFirestore(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function handleSeed() {
    setSeeding(true);
    setSeedStatus(null);
    try {
      await seedDefaultCoursePackages();
      await refresh();
      setSeedStatus({ type: "success", message: `${defaultCoursePackages.length} packages written to Firestore.` });
    } catch (e) {
      setSeedStatus({ type: "error", message: e instanceof Error ? e.message : "Seed failed — check console." });
      console.error("[seed]", e);
    } finally {
      setSeeding(false);
    }
  }

  async function applyDurationPriceIds(updated: CoursePackage[]) {
    await Promise.all(updated.map((pkg) => saveCoursePackage(pkg)));
    await refresh();
  }

  return (
    <AdminLayout>
      <AdminHeader
        title="Course Packages"
        subtitle="One-time purchasable packages. Set Paddle price IDs by duration tier below."
        action={
          <div className="flex items-center gap-3">
            {seedStatus && (
              <span className={`flex items-center gap-1.5 text-sm font-semibold ${seedStatus.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                {seedStatus.type === "success" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                {seedStatus.message}
              </span>
            )}
            <button type="button" onClick={handleSeed} disabled={seeding} className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-700 ring-1 ring-slate-200 disabled:opacity-60">
              {seeding && <Loader2 size={15} className="animate-spin" />}
              {seeding ? "Seeding…" : "Seed defaults"}
            </button>
          </div>
        }
      />

      {!fromFirestore && packages.length > 0 && (
        <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
          Showing code defaults — not yet saved to Firestore. Click &quot;Seed defaults&quot; to persist them.
        </div>
      )}

      <DurationPriceIds packages={packages} onApply={applyDurationPriceIds} />

      <div className="grid gap-4">
        {packages.map((pkg) => (
          <PackageEditor
            key={pkg.packageId}
            pkg={pkg}
            onSave={async (updated) => { await saveCoursePackage(updated); await refresh(); }}
          />
        ))}
        {packages.length === 0 && (
          <div className="rounded-[1.25rem] bg-white p-8 text-center ring-1 ring-slate-200">
            <p className="font-semibold text-slate-500">No packages found. Click &quot;Seed defaults&quot; to create the standard set.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
