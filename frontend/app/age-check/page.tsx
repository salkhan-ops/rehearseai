"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { AnimatedPage } from "@/components/animations";
import { Nav } from "@/components/Nav";
import { useAuth } from "@/lib/auth";

export default function AgeCheckPage() {
  const router = useRouter();
  const { confirmAgeEligibility, loading, profile, user } = useAuth();
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [minorConsentAcknowledged, setMinorConsentAcknowledged] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
    if (!loading && profile?.ageConfirmed) router.replace("/dashboard");
  }, [loading, profile?.ageConfirmed, router, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!ageConfirmed || !termsAccepted || !privacyAccepted) {
      setError("You must confirm age eligibility and accept the Terms and Privacy Policy.");
      return;
    }
    setSaving(true);
    try {
      await confirmAgeEligibility(minorConsentAcknowledged);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save age confirmation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f8fc] dark:bg-[#0e1020]">
      <Nav />
      <AnimatedPage className="mx-auto max-w-xl px-4 py-16">
        <form onSubmit={submit} className="rounded-[1.75rem] bg-white p-7 shadow-[0_18px_55px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#6200a8] dark:text-violet-200"><ShieldCheck size={16} /> Age eligibility</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white">Confirm before continuing</h1>
          <p className="mt-3 font-medium leading-7 text-slate-600 dark:text-white/60">RehearseAI is for users who are at least 16. Users under 18 should use it with parent or guardian permission.</p>
          <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-white/[0.06] dark:text-white/72 dark:ring-white/10">
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={ageConfirmed} onChange={(event) => setAgeConfirmed(event.target.checked)} className="mt-1 size-4 accent-[#6200a8]" />
              <span>I confirm I am at least 16 years old.</span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={minorConsentAcknowledged} onChange={(event) => setMinorConsentAcknowledged(event.target.checked)} className="mt-1 size-4 accent-[#6200a8]" />
              <span>If I am under 18, I should use RehearseAI with permission from a parent or guardian.</span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-1 size-4 accent-[#6200a8]" />
              <span>I agree to the <Link href="/terms" className="text-[#6200a8] dark:text-violet-200">Terms</Link>.</span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} className="mt-1 size-4 accent-[#6200a8]" />
              <span>I agree to the <Link href="/privacy" className="text-[#6200a8] dark:text-violet-200">Privacy Policy</Link>.</span>
            </label>
          </div>
          <button disabled={saving || !ageConfirmed || !termsAccepted || !privacyAccepted} className="mt-6 w-full rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.24)] disabled:opacity-60">
            {saving ? "Saving..." : "Continue"}
          </button>
          {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        </form>
      </AnimatedPage>
    </main>
  );
}
