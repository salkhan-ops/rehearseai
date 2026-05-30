"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { AnimatedPage } from "@/components/animations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Footer } from "@/components/content/Footer";
import { Nav } from "@/components/Nav";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection";
import { SubscriptionManager } from "@/components/subscription/SubscriptionManager";
import { useAuth } from "@/lib/auth";
import type { LanguageCode } from "@/lib/languages";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { logout, profile, updateLanguagePreferences, user } = useAuth();
  const [practiceLanguage, setPracticeLanguage] = useState<LanguageCode>(profile?.preferredPracticeLanguage || "en");
  const [feedbackLanguage, setFeedbackLanguage] = useState<LanguageCode>(profile?.preferredFeedbackLanguage || "en");

  useEffect(() => {
    if (profile?.preferredPracticeLanguage) setPracticeLanguage(profile.preferredPracticeLanguage);
    if (profile?.preferredFeedbackLanguage) setFeedbackLanguage(profile.preferredFeedbackLanguage);
  }, [profile?.preferredFeedbackLanguage, profile?.preferredPracticeLanguage]);

  return (
    <main className="cog-bg min-h-screen text-primary-token">
      <Nav />
      <ProtectedRoute>
        <AnimatedPage className="mx-auto max-w-5xl space-y-6 px-4 py-14">
          <section className="rounded-[2rem] surface-high p-6">
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]"><Settings size={16} /> Settings</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-[-0.055em]">Account controls</h1>
            <p className="mt-3 font-medium text-secondary-token">{user?.email || "Guest account"} · {profile?.planName || "Free"}</p>
          </section>

          <LanguageSelector
            practiceLanguage={practiceLanguage}
            feedbackLanguage={feedbackLanguage}
            onPracticeLanguageChange={(language) => {
              setPracticeLanguage(language);
              updateLanguagePreferences(language, feedbackLanguage).catch(() => undefined);
            }}
            onFeedbackLanguageChange={(language) => {
              setFeedbackLanguage(language);
              updateLanguagePreferences(practiceLanguage, language).catch(() => undefined);
            }}
          />

          <section className="rounded-[2rem] surface-high p-6">
            <h2 className="text-3xl font-semibold tracking-[-0.045em]">Voice and notifications</h2>
            <p className="mt-2 font-medium leading-7 text-secondary-token">Voice preferences, email reminders, and push notifications are structured for future expansion. Browser reminders are currently managed from the dashboard routine creator.</p>
          </section>

          <section className="rounded-[2rem] surface-high p-6">
            <h2 className="text-3xl font-semibold tracking-[-0.045em]">Need help?</h2>
            <p className="mt-2 font-medium leading-7 text-secondary-token">Contact support for billing, account access, privacy requests, bugs, or partnerships.</p>
            <Link href="/contact" className="mt-4 inline-flex rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">Open contact support</Link>
          </section>

          <SubscriptionManager />
          <DeleteAccountSection />
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-2xl surface-low px-5 py-3 font-semibold text-secondary-token ring-1 ring-[var(--border-soft)]"><LogOut size={16} /> Sign out</button>
        </AnimatedPage>
      </ProtectedRoute>
      <Footer />
    </main>
  );
}
