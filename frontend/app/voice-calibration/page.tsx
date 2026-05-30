"use client";

import { CheckCircle2, Mic, MicOff, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatedPage } from "@/components/animations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Nav } from "@/components/Nav";
import { useConversationCoordination } from "@/hooks/useConversationCoordination";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import { useAuth } from "@/lib/auth";

const fallbackParagraph = "Today I want to practice speaking clearly under pressure. I may pause while thinking, but I want the system to understand when I am finished and when I need a moment.";

export default function VoiceCalibrationPage() {
  const { getToken, userId } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [paragraph, setParagraph] = useState(fallbackParagraph);
  const [status, setStatus] = useState<"idle" | "recording" | "saving" | "complete">("idle");
  const [message, setMessage] = useState("");
  const startedAtRef = useRef<number | null>(null);
  const coordination = useConversationCoordination({ userId, token, enabled: true });
  const voice = useRealtimeVoice({ longPauseMs: 5200 });

  useEffect(() => {
    getToken().then(setToken);
  }, [getToken]);

  useEffect(() => {
    return voice.onFinalTranscript((text, metrics) => {
      finishCalibration(text, metrics);
    });
  }, [voice.onFinalTranscript]);

  async function start() {
    setMessage("");
    setStatus("recording");
    const next = await coordination.startCalibration();
    setParagraph(next.paragraph);
    voice.resetTranscript();
    startedAtRef.current = Date.now();
    voice.startListening();
  }

  async function finishCalibration(text?: string, metrics?: { speechDurationMs: number; silenceMs: number }) {
    const transcript = (text || `${voice.transcript} ${voice.interimTranscript}`).trim();
    if (!transcript) {
      setMessage("No speech captured yet.");
      setStatus("idle");
      return;
    }
    setStatus("saving");
    voice.stopListening();
    const fallbackDuration = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
    try {
      await coordination.completeCalibration({
        transcript,
        speechDurationMs: metrics?.speechDurationMs || fallbackDuration,
        pausesMs: metrics?.silenceMs ? [metrics.silenceMs] : undefined,
      });
      setStatus("complete");
      setMessage("Voice calibration saved.");
    } catch (err) {
      setStatus("idle");
      setMessage(err instanceof Error ? err.message : "Could not save calibration.");
    }
  }

  const transcript = `${voice.transcript} ${voice.interimTranscript}`.trim();

  return (
    <main className="min-h-screen bg-[#f4f8fc] text-slate-950 dark:bg-[#0e1020] dark:text-white">
      <Nav />
      <ProtectedRoute>
        <AnimatedPage className="mx-auto max-w-4xl px-4 py-14">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-cyan-200">Voice calibration</p>
              <h1 className="mt-3 text-5xl font-semibold tracking-[-0.05em] md:text-6xl">Tune the timing.</h1>
            </div>
            {coordination.profile && (
              <div className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/72 dark:ring-white/10">
                {Math.round(coordination.profile.averageWordsPerMinute)} WPM · {coordination.profile.longPauseThresholdMs} ms pause
              </div>
            )}
          </div>

          <section className="mt-8 rounded-[1.75rem] bg-white p-6 shadow-[0_18px_55px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/70 dark:bg-white/10 dark:ring-white/10">
            <p className="text-xl font-semibold leading-9 tracking-[-0.02em]">{paragraph}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {status !== "recording" ? (
                <button onClick={start} disabled={coordination.loading || !voice.supported} className="inline-flex items-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.24)] disabled:opacity-50">
                  <Mic size={18} /> Start reading
                </button>
              ) : (
                <button onClick={() => finishCalibration()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white dark:bg-white dark:text-slate-950">
                  <MicOff size={18} /> Finish
                </button>
              )}
              <button onClick={() => { voice.resetTranscript(); setStatus("idle"); setMessage(""); }} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 dark:bg-white/10 dark:text-white/72">
                <RotateCcw size={18} /> Reset
              </button>
            </div>
            {transcript && (
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700 dark:bg-black/20 dark:text-white/68">
                {transcript}
              </div>
            )}
          </section>

          {status === "complete" && coordination.profile && (
            <section className="mt-5 grid gap-3 rounded-[1.75rem] bg-emerald-50 p-5 text-emerald-950 ring-1 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-100 dark:ring-emerald-300/15 md:grid-cols-4">
              <div className="flex items-center gap-2 font-semibold md:col-span-4"><CheckCircle2 size={19} /> {message}</div>
              <Metric label="Words/min" value={Math.round(coordination.profile.averageWordsPerMinute)} />
              <Metric label="Avg pause" value={`${coordination.profile.averagePauseMs} ms`} />
              <Metric label="Long pause" value={`${coordination.profile.longPauseThresholdMs} ms`} />
              <Metric label="Fillers" value={`${Math.round(coordination.profile.fillerWordRate * 100)}%`} />
            </section>
          )}

          {message && status !== "complete" && <p className="mt-4 text-sm font-semibold text-rose-600 dark:text-rose-200">{message}</p>}
        </AnimatedPage>
      </ProtectedRoute>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 dark:bg-white/10">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] opacity-60">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</div>
    </div>
  );
}
