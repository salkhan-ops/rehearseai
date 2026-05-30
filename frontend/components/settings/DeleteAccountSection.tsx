"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { requestAccountDeletion } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function DeleteAccountSection() {
  const { getToken } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  async function submit() {
    const token = await getToken();
    await requestAccountDeletion(reason, token);
    setMessage("Account deletion request recorded. Cancel any active subscription before final deletion.");
    setConfirm(false);
  }

  return (
    <section className="rounded-[2rem] surface-high p-6">
      <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-rose-400"><Trash2 size={16} /> Delete account</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-primary-token">Request account deletion</h2>
      <p className="mt-2 font-medium leading-7 text-secondary-token">This is irreversible after processing. Reports, analytics, transcripts, and history may be permanently deleted. Please cancel your subscription first.</p>
      {confirm ? (
        <div className="mt-5">
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Optional reason" className="w-full resize-none rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-primary-token outline-none" />
          <div className="mt-3 flex gap-2">
            <button onClick={submit} className="rounded-2xl bg-rose-500 px-5 py-3 font-semibold text-white">Confirm deletion request</button>
            <button onClick={() => setConfirm(false)} className="rounded-2xl surface-low px-5 py-3 font-semibold text-secondary-token ring-1 ring-[var(--border-soft)]">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirm(true)} className="mt-5 rounded-2xl bg-rose-500/12 px-5 py-3 font-semibold text-rose-400 ring-1 ring-rose-300/20">Request deletion</button>
      )}
      {message && <p className="mt-4 rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-500">{message}</p>}
    </section>
  );
}
