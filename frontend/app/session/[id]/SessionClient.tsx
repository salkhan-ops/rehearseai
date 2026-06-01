"use client";

import { motion } from "framer-motion";
import { ArrowLeft, BrainCircuit, Clock3, Mic, MicOff, Send, Square, Volume2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";
import { AnimatedMessage, AnimatedPage, TypingIndicator } from "@/components/animations";
import { BeginnerBriefing } from "@/components/learning/BeginnerBriefing";
import { CoachPanel } from "@/components/learning/CoachPanel";
import { ConversationMap } from "@/components/learning/ConversationMap";
import { FloatingHint } from "@/components/learning/FloatingHint";
import { useConversationCoordination } from "@/hooks/useConversationCoordination";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import { completeCourseSession, endSession, generateReport, getSession, sendMessage, updateSessionHint } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getLanguage, isRtlLanguage } from "@/lib/languages";
import { reportHref } from "@/lib/routes";
import { outcomeFromReport, sendSessionOutcome, sendTurnTelemetry } from "@/lib/telemetry";
import type { Message, Session, SessionHint } from "@/lib/types";

type OrbMode = "idle" | "listening" | "thinking" | "speaking" | "pressure" | "error";

const voiceOptions = [
  { label: "Skylar", id: "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4", note: "warm female" },
  { label: "Backend default", id: "", note: "from .env" },
];

const durationOptions = [5, 10, 15, 30, 45, 60];

const listeningPrompts: Record<string, string> = {
  en: "I am listening. Start your answer when you are ready.",
  ar: "أنا أستمع. ابدأ إجابتك عندما تكون جاهزًا.",
  ur: "میں سن رہی ہوں۔ جب آپ تیار ہوں تو اپنا جواب شروع کریں۔",
  hi: "मैं सुन रही हूँ। जब आप तैयार हों तो अपना जवाब शुरू करें।",
  es: "Estoy escuchando. Empieza tu respuesta cuando estés listo.",
  fr: "Je vous écoute. Commencez votre réponse quand vous êtes prêt.",
};

function stateCopy(mode: OrbMode, voiceMode: boolean, autoSubmitNotice: string) {
  if (autoSubmitNotice) return autoSubmitNotice;
  if (voiceMode && mode === "pressure") return "Nerve pressure is active. Defend the claim directly.";
  if (mode === "listening") return "Listening. Speak naturally.";
  if (mode === "thinking") return "Reasoning through your response.";
  if (mode === "speaking") return "AI persona is responding.";
  if (mode === "pressure") return "Pressure rising. Stay structured.";
  if (mode === "error") return "Voice fallback is ready.";
  return voiceMode ? "Waiting for your next answer." : "Tap start and enter the chamber.";
}

function MicroMetric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-full bg-white/[0.08] px-4 py-3 text-white/82 ring-1 ring-white/12 backdrop-blur-2xl"
    >
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${tone} shadow-[0_0_18px_currentColor]`} />
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">{label}</div>
          <div className="text-sm font-semibold">{value}%</div>
        </div>
      </div>
    </motion.div>
  );
}

function AmbientField({ mode }: { mode: OrbMode }) {
  const pressure = mode === "pressure";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className={`absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${pressure ? "bg-rose-500/16" : "bg-cyan-400/14"}`}
        animate={{ scale: pressure ? [1, 1.12, 1] : [0.95, 1.08, 0.98], opacity: [0.45, 0.78, 0.5] }}
        transition={{ duration: pressure ? 2.2 : 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-12rem] top-[-10rem] h-[35rem] w-[35rem] rounded-full bg-violet-500/20 blur-3xl"
        animate={{ x: [0, -28, 0], y: [0, 22, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-14rem] left-[-10rem] h-[32rem] w-[32rem] rounded-full bg-blue-500/16 blur-3xl"
        animate={{ x: [0, 28, 0], y: [0, -18, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
    </div>
  );
}

export default function SessionPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id || searchParams.get("id") || "";
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [customDuration, setCustomDuration] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState(voiceOptions[0].id);
  const [voiceMode, setVoiceMode] = useState(false);
  const [latestHint, setLatestHint] = useState<SessionHint | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [autoSubmitNotice, setAutoSubmitNotice] = useState("");
  const autoEndingRef = useRef(false);
  const { getToken, userId } = useAuth();
  const practiceLanguage = getLanguage(session?.practiceLanguage);
  const beginnerMode = session?.difficulty === "Beginner" || session?.difficulty === "Friendly";
  const coordination = useConversationCoordination({ userId, sessionId: id, enabled: voiceMode });
  const { analyze: analyzeCoordination } = coordination;
  const voice = useRealtimeVoice({ browserSpeechCode: practiceLanguage.browserSpeechCode, deepgramCode: practiceLanguage.deepgramCode, longPauseMs: coordination.longPauseMs || 3400 });

  useEffect(() => {
    if (!id) {
      setError("Missing session id.");
      return;
    }
    getToken()
      .then((token: string | null) => getSession(id, token))
      .then((data: { session: Session; messages: Message[] }) => {
        setSession(data.session);
        if (data.session.durationPreference) setDurationMinutes(data.session.durationPreference);
        setMessages(data.messages);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load this session."));
  }, [id, getToken]);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = useMemo(() => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`, [seconds]);
  const remainingSeconds = Math.max(durationMinutes * 60 - seconds, 0);
  const remainingTime = useMemo(() => `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`, [remainingSeconds]);

  const orbMode: OrbMode = useMemo(() => {
    if (voice.voiceState === "error" || error) return "error";
    if (loading || voice.isProcessing) return "thinking";
    if (voice.isSpeaking) return "speaking";
    if ((session?.difficulty === "Brutal" || session?.difficulty === "Nerve") && voice.isListening) return "pressure";
    if (voice.isListening || voice.voiceState === "user_speaking" || voice.voiceState === "silence_detected") return "listening";
    return "idle";
  }, [error, loading, session?.difficulty, voice.isListening, voice.isProcessing, voice.isSpeaking, voice.voiceState]);

  useEffect(() => {
    if (voice.transcript || voice.interimTranscript) {
      setDraft(`${voice.transcript} ${voice.interimTranscript}`.trim());
      analyzeCoordination({
        transcript: voice.transcript,
        interimTranscript: voice.interimTranscript,
        silenceMs: 0,
      });
    }
  }, [analyzeCoordination, voice.transcript, voice.interimTranscript]);

  useEffect(() => {
    return voice.onFinalTranscript((nextTranscript, metrics) => {
      if (!voiceMode || loading) return;
      submitContent(nextTranscript, true, metrics);
    });
  }, [voice.onFinalTranscript, voiceMode, loading]);

  useEffect(() => {
    if (!voiceMode || loading || voice.isSpeaking) return;
    if (voice.supported && voice.voiceState === "idle") voice.startListening();
    return () => {
      if (!voiceMode) voice.stopListening();
    };
  }, [voiceMode, loading, voice.isSpeaking, voice.supported, voice.voiceState, voice.startListening, voice.stopListening]);

  useEffect(() => {
    if (!session || session.status === "completed" || loading || autoEndingRef.current) return;
    if (seconds < durationMinutes * 60) return;
    autoEndingRef.current = true;
    setAutoSubmitNotice("Time is up. Generating your report...");
    finish();
  }, [durationMinutes, loading, seconds, session]);

  async function submitContent(content: string, fromVoice = false, voiceMetrics?: { speechDurationMs: number; silenceMs: number }) {
    if (!content.trim()) return;
    setError("");
    setAutoSubmitNotice(fromVoice ? "Auto-sending your turn..." : "");
    if (session?.status === "completed") {
      setVoiceMode(false);
      voice.stopListening();
      setAutoSubmitNotice("");
      setError("This session is already completed. Start a new practice session for hands-free voice.");
      return;
    }
    setDraft("");
    voice.resetTranscript();
    setLoading(true);
    try {
      const token = await getToken();
      const metrics = voiceMetrics || { speechDurationMs: 0, silenceMs: 0 };
      const requestStartedAt = Date.now();
      const result = await sendMessage(id, content.trim(), userId, token, {
        transcript: content.trim(),
        interimTranscript: "",
        speechDurationMs: metrics.speechDurationMs,
        silenceMs: metrics.silenceMs,
        sessionId: id,
        userId,
      });
      const responseLatencyMs = Date.now() - requestStartedAt;
      setMessages((current) => [...current, result.userMessage, result.aiMessage]);
      setSession((current) => current ? { ...current, turnCount: result.turnCount } : current);
      if (beginnerMode && result.hint) {
        setLatestHint(result.hint);
        setHintVisible(true);
        updateSessionHint(result.hint.hintId, { wasViewed: true }, token).catch(() => undefined);
        window.setTimeout(() => setHintVisible(false), 6500);
      }
      if (session) {
        sendTurnTelemetry({
          userId,
          sessionId: id,
          turnId: result.userMessage.id,
          practiceType: session.practiceType,
          difficulty: session.difficulty,
          language: session.practiceLanguage || "en",
          transcript: content.trim(),
          speechDurationMs: metrics.speechDurationMs,
          silenceBeforeMs: metrics.silenceMs,
          silenceAfterMs: metrics.silenceMs,
          userTurnIndex: result.turnCount,
          aiTurnIndex: result.turnCount,
          responseLatencyMs,
          aiWaitedMs: metrics.silenceMs,
          aiResponseText: result.aiMessage.content,
          recommendedAiTone: coordination.state?.recommendedAiTone,
          recommendedResponseLength: coordination.state?.recommendedResponseLength,
          detectedUserState: coordination.state?.userState,
          detectedPressureState: coordination.state?.pressureAdjustment,
          userInterruptedAi: false,
          aiInterruptedUser: Boolean(coordination.state?.shouldAiInterrupt),
        }, token).catch(() => undefined);
      }
      await voice.speak(result.aiMessage.content, selectedVoiceId || undefined, practiceLanguage.browserSpeechCode);
      if (fromVoice && voiceMode) voice.startListening();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send your response.";
      if (message.includes("Session already completed")) {
        setVoiceMode(false);
        voice.stopListening();
        setSession((current) => current ? { ...current, status: "completed" } : current);
        setError("This session is already completed. Start a new practice session for hands-free voice.");
      } else {
        setError(message);
      }
    } finally {
      setAutoSubmitNotice("");
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitContent(draft);
  }

  async function finish() {
    setError("");
    voice.stopListening();
    voice.stopSpeaking();
    setLoading(true);
    try {
      const token = await getToken();
      await endSession(id, token);
      const courseSessionId = searchParams.get("courseSessionId");
      if (courseSessionId) await completeCourseSession(courseSessionId, id, token).catch(() => undefined);
      const report = await generateReport(id, token);
      if (session) {
        await sendSessionOutcome(outcomeFromReport({ ...session, status: "completed" }, report, seconds), token).catch(() => undefined);
      }
      router.push(reportHref(report.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate report. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`relative min-h-screen overflow-hidden bg-[#07111f] text-white transition-colors ${hintVisible && latestHint ? "bg-[#0b182b]" : ""}`} dir={isRtlLanguage(session?.practiceLanguage) ? "rtl" : "ltr"}>
      <AmbientField mode={orbMode} />
      {beginnerMode && <FloatingHint hint={hintVisible ? latestHint : null} onExpand={() => {
        if (latestHint) {
          setHintVisible(true);
          getToken().then((token) => updateSessionHint(latestHint.hintId, { wasViewed: true, wasExpanded: true }, token)).catch(() => undefined);
        }
      }} />}
      {beginnerMode && session && <CoachPanel session={session} latestHint={latestHint} progress={Math.min(100, Math.round(((session.turnCount || 0) / 6) * 100))} />}
      <AnimatedPage className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6">
        <header className="flex items-center justify-between">
          <Link href="/practice" className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white/76 ring-1 ring-white/12 backdrop-blur-2xl transition hover:bg-white/[0.12]">
            <ArrowLeft size={16} /> Exit chamber
          </Link>
          <div className="hidden items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white/76 ring-1 ring-white/12 backdrop-blur-2xl sm:flex">
            <BrainCircuit size={16} /> {session?.practiceType || "Loading"} · elapsed {time}
          </div>
          <div className="flex items-center gap-2">
            <label className="hidden items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-xs font-semibold text-white/70 ring-1 ring-white/12 backdrop-blur-2xl md:flex">
              <Volume2 size={14} />
              <select
                value={selectedVoiceId}
                onChange={(event) => setSelectedVoiceId(event.target.value)}
                className="bg-transparent text-white outline-none [color-scheme:dark]"
                aria-label="AI voice"
              >
                {voiceOptions.map((option) => <option key={option.label} value={option.id}>{option.label} · {option.note}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-xs font-semibold text-white/70 ring-1 ring-white/12 backdrop-blur-2xl">
              <Clock3 size={14} />
              {customDuration ? (
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={durationMinutes}
                  onChange={(event) => {
                    autoEndingRef.current = false;
                    setDurationMinutes(Math.min(120, Math.max(1, Number(event.target.value) || 1)));
                  }}
                  className="w-16 bg-transparent text-white outline-none [color-scheme:dark]"
                  aria-label="Custom session duration"
                />
              ) : (
                <select
                  value={durationOptions.includes(durationMinutes) ? durationMinutes : "custom"}
                  onChange={(event) => {
                    autoEndingRef.current = false;
                    if (event.target.value === "custom") {
                      setCustomDuration(true);
                      return;
                    }
                    setDurationMinutes(Number(event.target.value));
                  }}
                  className="bg-transparent text-white outline-none [color-scheme:dark]"
                  aria-label="Session duration"
                >
                  {durationOptions.map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}
                  <option value="custom">Custom</option>
                </select>
              )}
              <button type="button" onClick={() => setCustomDuration((value) => !value)} className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/50">
                {customDuration ? "Presets" : "Custom"}
              </button>
              <span className="hidden text-white/36 sm:inline">left {remainingTime}</span>
            </label>
          </div>
        </header>

        <section className="relative grid flex-1 place-items-center py-8">
          <div className="absolute left-0 top-8 hidden max-w-xs space-y-3 lg:block">
            <MicroMetric label="Confidence" value={voice.isListening ? 74 : 68} tone="bg-cyan-300 text-cyan-300" />
            <MicroMetric label="Reasoning stability" value={loading ? 61 : 82} tone="bg-violet-300 text-violet-300" />
          </div>
          <div className="absolute right-0 top-20 hidden max-w-xs space-y-3 lg:block">
            <MicroMetric label="Pressure" value={session?.difficulty === "Nerve" ? Math.min(100, (session.pressureLevel || 1) * 10) : session?.difficulty === "Brutal" ? 88 : session?.difficulty === "Realistic" ? 62 : 34} tone="bg-rose-300 text-rose-300" />
            <MicroMetric label="Recovery" value={voice.isSpeaking ? 78 : 71} tone="bg-emerald-300 text-emerald-300" />
          </div>

          <div className="w-full max-w-4xl text-center">
            <div className="mx-auto mb-3 w-fit rounded-full bg-white/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/76 ring-1 ring-white/12 backdrop-blur-2xl">
              {voice.provider === "deepgram" ? "Deepgram live" : "Browser fallback"} · {practiceLanguage.nativeName} · {session?.difficulty || "Realistic"}{session?.difficulty === "Nerve" ? ` · pressure ${session.pressureLevel || 1}/10` : ""}
            </div>
            <AIPresenceOrb state={orbMode} intensity={(session?.turnCount || 0) / 8} />
            <h1 className="mx-auto -mt-3 max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl">
              {session?.practiceType || "Cognitive simulation"}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-white/56 sm:text-lg">
              {stateCopy(orbMode, voiceMode, autoSubmitNotice)}
            </p>
            {beginnerMode && session && messages.length === 0 && (
              <div className="mt-8 grid gap-4 text-left">
                <BeginnerBriefing session={session} />
                <ConversationMap session={session} />
              </div>
            )}
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-5xl pb-4">
          {error && (
            <div className="mb-3 rounded-[1.25rem] bg-rose-400/12 p-4 text-sm font-semibold text-rose-100 ring-1 ring-rose-200/20 backdrop-blur-2xl">
              {error}
            </div>
          )}

          <div className="mb-3 max-h-[24vh] space-y-3 overflow-y-auto px-1 [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]">
            {messages.length === 0 && (
              <AnimatedMessage className="mx-auto max-w-2xl text-center text-lg font-medium leading-8 text-white/72">
                {session?.difficulty === "Nerve" ? "The panel is present. Make your claim, then defend the evidence, assumptions, and risks under pressure." : "The persona is present. Start with your opening answer, and the room will adapt to your clarity, composure, and logic."}
              </AnimatedMessage>
            )}
            {messages.slice(-5).map((message) => (
              <AnimatedMessage key={message.id} className={`${message.role === "user" ? "ml-auto max-w-2xl text-right text-white/58" : "mr-auto max-w-3xl text-left text-white/84"} rounded-[1.35rem] bg-white/[0.06] p-4 ring-1 ring-white/10 backdrop-blur-2xl`}>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/34">{message.role === "user" ? "You" : "AI persona"}</div>
                <div className="text-base font-medium leading-7">{message.content}</div>
              </AnimatedMessage>
            ))}
            {loading && <TypingIndicator />}
          </div>

          {(voice.transcript || voice.interimTranscript) && (
            <div className="mb-3 rounded-[1.35rem] bg-cyan-100/[0.08] p-4 text-center text-sm font-medium leading-6 text-cyan-50/80 ring-1 ring-cyan-100/15 backdrop-blur-2xl">
              <span>{voice.transcript}</span>
              {voice.interimTranscript && <span className="text-cyan-100/38"> {voice.interimTranscript}</span>}
            </div>
          )}

          <div className="mb-3 grid gap-2 text-xs font-semibold text-white/70 md:hidden">
            <label className="flex items-center justify-between rounded-full bg-white/[0.08] px-4 py-3 ring-1 ring-white/12 backdrop-blur-2xl">
              <span className="inline-flex items-center gap-2"><Volume2 size={14} /> AI voice</span>
              <select value={selectedVoiceId} onChange={(event) => setSelectedVoiceId(event.target.value)} className="bg-transparent text-white outline-none [color-scheme:dark]">
                {voiceOptions.map((option) => <option key={option.label} value={option.id}>{option.label}</option>)}
              </select>
            </label>
            <div className="rounded-full bg-white/[0.08] px-4 py-3 text-center ring-1 ring-white/12 backdrop-blur-2xl">
              Session ends in {remainingTime}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/[0.08] p-3 ring-1 ring-white/12 backdrop-blur-2xl">
            <form onSubmit={onSubmit} className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (voiceMode) {
                    setVoiceMode(false);
                    voice.stopListening();
                    voice.stopSpeaking();
                  } else {
                    setError("");
                    setVoiceMode(true);
                    if (session?.status !== "completed") {
                      voice.speak(listeningPrompts[practiceLanguage.code] || listeningPrompts.en, selectedVoiceId || undefined, practiceLanguage.browserSpeechCode).then(() => voice.startListening());
                      return;
                    }
                    voice.startListening();
                  }
                }}
                disabled={!voice.supported || session?.status === "completed"}
                className={`grid size-14 shrink-0 place-items-center rounded-full transition disabled:opacity-45 ${voiceMode ? "bg-cyan-200 text-slate-950 shadow-[0_0_40px_rgba(125,211,252,0.36)]" : "bg-white/[0.10] text-white ring-1 ring-white/12"}`}
                aria-label={voiceMode ? "Stop live conversation" : "Start live conversation"}
              >
                {voiceMode ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={1}
                className="max-h-32 min-h-14 min-w-0 flex-1 resize-none rounded-[1.35rem] border border-white/10 bg-white/[0.07] px-4 py-4 text-base font-medium text-white outline-none transition placeholder:text-white/32 focus:border-cyan-200/40 focus:ring-4 focus:ring-cyan-200/10"
                placeholder={voiceMode ? "Voice is active. Text remains available." : "Speak or type your response..."}
              />
              <button className="grid size-14 shrink-0 place-items-center rounded-full bg-white text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.16)] transition hover:scale-105">
                <Send size={20} />
              </button>
            </form>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-xs font-semibold text-white/42">
              <span className="inline-flex items-center gap-2"><Volume2 size={14} /> {voiceMode ? stateCopy(orbMode, voiceMode, autoSubmitNotice) : "Voice-first mode is ready"}</span>
              <button onClick={finish} disabled={loading} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-rose-100 transition hover:bg-rose-300/10 disabled:opacity-60">
                <Square size={13} /> End and generate report
              </button>
            </div>
          </div>
        </section>
      </AnimatedPage>
    </main>
  );
}
