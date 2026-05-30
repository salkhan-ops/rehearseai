"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CreditCard, ExternalLink, RotateCcw, XCircle } from "lucide-react";
import { cancelSubscription, getCurrentSubscription, getSubscriptionPortalLink, reactivateSubscription } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { CurrentSubscription } from "@/lib/types";

export function SubscriptionManager() {
  const { getToken } = useAuth();
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getToken().then(getCurrentSubscription).then(setSubscription).catch(() => undefined);
  }, [getToken]);

  async function cancel(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const token = await getToken();
    const next = await cancelSubscription(reason, token);
    setSubscription(next);
    setConfirming(false);
    setLoading(false);
  }

  async function reactivate() {
    setLoading(true);
    const token = await getToken();
    setSubscription(await reactivateSubscription(token));
    setLoading(false);
  }

  async function portal() {
    const token = await getToken();
    const link = await getSubscriptionPortalLink(token);
    if (link.url) window.location.href = link.url;
    else setMessage(link.message);
  }

  if (!subscription) return <div className="rounded-[2rem] surface-high p-6 font-semibold text-secondary-token">Loading subscription...</div>;

  return (
    <section className="rounded-[2rem] surface-high p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]"><CreditCard size={16} /> Subscription</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-primary-token">{subscription.plan?.name || subscription.planName || "Free"} plan</h1>
          <p className="mt-2 font-medium text-secondary-token">Status: {subscription.status} · Billing by Paddle</p>
          {subscription.currentPeriodEnd && <p className="mt-1 text-sm font-medium text-tertiary-token">Renews/access through {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>}
        </div>
        <span className="rounded-full surface-medium px-4 py-2 text-sm font-semibold text-secondary-token">{subscription.cancelAtPeriodEnd ? "Cancels at period end" : "Active access"}</span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {(subscription.plan?.features || ["Limited sessions", "Basic feedback"]).map((feature) => (
          <div key={feature} className="rounded-2xl surface-medium p-4 text-sm font-semibold text-secondary-token">{feature}</div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Link href="/pricing" className="rounded-2xl bg-[#6200a8] px-5 py-3 text-center font-semibold text-white">Upgrade / downgrade</Link>
        <button onClick={portal} className="inline-flex items-center justify-center gap-2 rounded-2xl surface-low px-5 py-3 font-semibold text-secondary-token ring-1 ring-[var(--border-soft)]">Billing portal <ExternalLink size={16} /></button>
        {subscription.cancelAtPeriodEnd ? (
          <button onClick={reactivate} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl surface-low px-5 py-3 font-semibold text-secondary-token ring-1 ring-[var(--border-soft)]"><RotateCcw size={16} /> Reactivate</button>
        ) : (
          <button onClick={() => setConfirming(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500/12 px-5 py-3 font-semibold text-rose-400 ring-1 ring-rose-300/20"><XCircle size={16} /> Cancel</button>
        )}
      </div>

      {confirming && (
        <form onSubmit={cancel} className="mt-6 rounded-[1.5rem] bg-rose-500/10 p-5 ring-1 ring-rose-300/20">
          <div className="flex gap-3">
            <AlertTriangle className="shrink-0 text-rose-400" />
            <div>
              <h2 className="font-semibold text-primary-token">Cancel subscription?</h2>
              <p className="mt-1 text-sm font-medium leading-6 text-secondary-token">Access remains until the end of the current billing period. You can reactivate before the period ends.</p>
            </div>
          </div>
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Optional feedback" className="mt-4 w-full resize-none rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-primary-token outline-none" />
          <div className="mt-4 flex gap-2">
            <button disabled={loading} className="rounded-2xl bg-rose-500 px-5 py-3 font-semibold text-white disabled:opacity-60">Confirm cancellation</button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded-2xl surface-low px-5 py-3 font-semibold text-secondary-token ring-1 ring-[var(--border-soft)]">Keep plan</button>
          </div>
        </form>
      )}
      {message && <p className="mt-4 rounded-2xl surface-medium px-4 py-3 text-sm font-semibold text-secondary-token">{message}</p>}
    </section>
  );
}
