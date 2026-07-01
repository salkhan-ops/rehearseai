"use client";

import { LogOut, Mic, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AnimatedPage } from "@/components/animations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Footer } from "@/components/content/Footer";
import { CameraSignalControls } from "@/components/local-signals/CameraSignalControls";
import { Nav } from "@/components/Nav";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection";
import { BillingSection } from "@/components/billing/BillingSection";
import { useAuth } from "@/lib/auth";
import type { LanguageCode } from "@/lib/languages";
import { getPersonalSpeechProfile, getTelemetryConsent, type PrivacySettings, updateTelemetryConsent } from "@/lib/telemetry";
import type { VoiceProfile } from "@/lib/types";
import { useEffect, useState } from "react";

const defaultPrivacySettings: PrivacySettings = {
  allowTelemetry: true,
  allowModelImprovement: true,
  allowRawAudioStorage: false,
  allowCameraAssistedTiming: true,
  allowLocalSignalTelemetry: false,
  allowRawVideoStorage: false,
};

export default function SettingsPage() {
  const { logout, profile, updateLanguagePreferences, user } = useAuth();
  const [practiceLanguage, setPracticeLanguage] = useState<LanguageCode>("en");
  const [feedbackLanguage, setFeedbackLanguage] = useState<LanguageCode>("en");
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(profile?.privacySettings || defaultPrivacySettings);
  const [speechProfile, setSpeechProfile] = useState<VoiceProfile | null>(null);
  const [privacySaving, setPrivacySaving] = useState(false);

  useEffect(() => {
    // Language switching not yet active — always keep English
    if (profile?.privacySettings) setPrivacySettings(profile.privacySettings);
  }, [profile?.preferredFeedbackLanguage, profile?.preferredPracticeLanguage, profile?.privacySettings]);

  useEffect(() => {
    if (!user?.uid) return;
    user.getIdToken()
      .then(async (token) => {
        const [settings, personalProfile] = await Promise.all([
          getTelemetryConsent(user.uid, token),
          getPersonalSpeechProfile(user.uid, token).catch(() => null),
        ]);
        setPrivacySettings(settings);
        setSpeechProfile(personalProfile);
      })
      .catch(() => undefined);
  }, [user]);

  async function updatePrivacy(nextSettings: PrivacySettings) {
    setPrivacySettings(nextSettings);
    if (!user?.uid) return;
    setPrivacySaving(true);
    try {
      const token = await user.getIdToken();
      setPrivacySettings(await updateTelemetryConsent(user.uid, nextSettings, token));
    } finally {
      setPrivacySaving(false);
    }
  }

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
            <p className="mt-2 font-medium leading-7 text-secondary-token">Voice preferences, email reminders, and push notifications are structured for future expansion. Browser reminders are managed from the dashboard routine creator.</p>
            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-white/60 p-4 ring-1 ring-[var(--border-soft)] dark:bg-white/[0.04]">
              <div>
                <div className="flex items-center gap-2 font-semibold"><Mic size={16} className="text-[var(--accent-primary)]" /> Voice calibration</div>
                <p className="mt-1 text-sm font-medium text-secondary-token">Calibrate your speaking pace so the AI knows when you have finished talking. Takes about 60 seconds.</p>
              </div>
              <Link href="/voice-calibration" className="shrink-0 rounded-2xl bg-[#6200a8] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5">
                Calibrate
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] surface-high p-6">
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]"><ShieldCheck size={16} /> Privacy</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">Conversation improvement data</h2>
            <p className="mt-2 font-medium leading-7 text-secondary-token">Voice timing and transcript features may be used to improve personalization and conversation timing. Raw audio stays off by default.</p>
            {speechProfile && (
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                {[
                  ["Samples", speechProfile.sampleCount || 0],
                  ["Pace", `${Math.round(speechProfile.averageWordsPerMinute || 0)} wpm`],
                  ["Thinking pause", `${speechProfile.thinkingPauseMs || speechProfile.averagePauseMs || 0} ms`],
                  ["AI wait", `${speechProfile.preferredAiWaitMs || 0} ms`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white/60 p-4 ring-1 ring-[var(--border-soft)] dark:bg-white/[0.04]">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-tertiary-token">{label}</div>
                    <div className="mt-1 text-lg font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5 space-y-3">
              <CameraSignalControls
                enabled={Boolean(privacySettings.allowCameraAssistedTiming)}
                telemetryEnabled={Boolean(privacySettings.allowLocalSignalTelemetry)}
                showTelemetry
                onEnabledChange={(enabled) => updatePrivacy({ ...privacySettings, allowCameraAssistedTiming: enabled, allowRawVideoStorage: false })}
                onTelemetryChange={(enabled) => updatePrivacy({ ...privacySettings, allowLocalSignalTelemetry: enabled, allowRawVideoStorage: false })}
              />
              {[
                ["allowTelemetry", "Improve conversation timing using anonymized practice signals"],
                ["allowModelImprovement", "Allow my data to improve personalization"],
                ["allowRawAudioStorage", "Store raw audio"],
              ].map(([key, label]) => (
                <label key={key} className={`${key === "allowRawAudioStorage" ? "opacity-70" : ""} flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-white/60 p-4 ring-1 ring-[var(--border-soft)] dark:bg-white/[0.04]`}>
                  <span>
                    <span className="block font-semibold">{label}</span>
                    {key === "allowRawAudioStorage" && <span className="mt-1 block text-sm font-medium text-secondary-token">Advanced option. Leave off unless explicitly requested for a future feature.</span>}
                  </span>
                  <input
                    type="checkbox"
                    checked={privacySettings[key as keyof PrivacySettings]}
                    onChange={(event) => updatePrivacy({ ...privacySettings, [key]: event.target.checked })}
                    className="size-5 accent-[#6200a8]"
                  />
                </label>
              ))}
              <div className="rounded-2xl bg-white/60 p-4 ring-1 ring-[var(--border-soft)] dark:bg-white/[0.04]">
                <span className="block font-semibold">Raw video storage</span>
                <span className="mt-1 block text-sm font-medium text-secondary-token">Not supported. RehearseAI does not record, upload, or store camera video/images.</span>
                <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">Always off</span>
              </div>
            </div>
            {privacySaving && <p className="mt-3 text-sm font-semibold text-secondary-token">Saving privacy settings...</p>}
          </section>

          <section className="rounded-[2rem] surface-high p-6">
            <h2 className="text-3xl font-semibold tracking-[-0.045em]">Need help?</h2>
            <p className="mt-2 font-medium leading-7 text-secondary-token">Contact support for billing, account access, privacy requests, bugs, or partnerships.</p>
            <Link href="/contact" className="mt-4 inline-flex rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">Open contact support</Link>
          </section>

          <BillingSection />
          <DeleteAccountSection />
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-2xl surface-low px-5 py-3 font-semibold text-secondary-token ring-1 ring-[var(--border-soft)]"><LogOut size={16} /> Sign out</button>
        </AnimatedPage>
      </ProtectedRoute>
      <Footer />
    </main>
  );
}
