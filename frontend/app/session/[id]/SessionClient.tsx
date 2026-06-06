"use client";

import { motion } from "framer-motion";
import { ArrowLeft, BrainCircuit, Camera, Clock3, Eye, EyeOff, Mic, MicOff, Send, ShieldCheck, Square, UsersRound, Volume2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AICharacterEnvironment } from "@/components/AICharacterEnvironment";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";
import { AnimatedMessage, AnimatedPage, TypingIndicator } from "@/components/animations";
import { BeginnerBriefing } from "@/components/learning/BeginnerBriefing";
import { CoachPanel } from "@/components/learning/CoachPanel";
import { ConversationMap } from "@/components/learning/ConversationMap";
import { FloatingHint } from "@/components/learning/FloatingHint";
import { CameraPrivacyNotice } from "@/components/local-signals/CameraPrivacyNotice";
import { ConversationModeToggle } from "@/components/session/ConversationModeToggle";
import { LiveTranscriptPanel } from "@/components/session/LiveTranscriptPanel";
import { NaturalConversationControls } from "@/components/session/NaturalConversationControls";
import { useConversationCoordination } from "@/hooks/useConversationCoordination";
import { useLocalCameraSignals } from "@/hooks/useLocalCameraSignals";
import { useNaturalConversation } from "@/hooks/useNaturalConversation";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import { completeCourseSession, endSession, generateReport, getSession, sendMessage, updateSessionHint } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getLanguage, isRtlLanguage } from "@/lib/languages";
import { pauseFusionEngine } from "@/lib/local-signals/pauseFusionEngine";
import { reportHref } from "@/lib/routes";
import { getTelemetryConsent, outcomeFromReport, saveLocalSignalTelemetry, sendSessionOutcome, sendTurnTelemetry, type PrivacySettings, updateTelemetryConsent } from "@/lib/telemetry";
import { environmentModes } from "@/lib/types";
import type { ConversationControl, ConversationMode, EnvironmentMode, Message, Session, SessionHint } from "@/lib/types";
import type { PauseFusionDecision } from "@/lib/local-signals/types";

type OrbMode = "idle" | "listening" | "thinking" | "speaking" | "pressure" | "error";

const voiceOptions = [
  { label: "Skylar", id: "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4", note: "warm female" },
  { label: "Backend default", id: "", note: "from .env" },
];

const durationOptions = [5, 10, 15, 30, 45, 60];

const defaultPrivacySettings: PrivacySettings = {
  allowTelemetry: true,
  allowModelImprovement: true,
  allowRawAudioStorage: false,
  allowCameraAssistedTiming: false,
  allowLocalSignalTelemetry: false,
  allowRawVideoStorage: false,
};

function normalizePrivacySettings(settings?: Partial<PrivacySettings> | null): PrivacySettings {
  return { ...defaultPrivacySettings, ...(settings || {}), allowRawVideoStorage: false };
}

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
  if (mode === "thinking") return "Reading the last thing you said.";
  if (mode === "speaking") return "Responding in character.";
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

function stanceLabel(control?: ConversationControl | null) {
  if (!control) return "Neutral";
  return control.stance.replace(/^\w/, (match) => match.toUpperCase());
}

function pressurePercent(control?: ConversationControl | null, session?: Session | null) {
  const level = control?.pressureLevel || session?.pressureLevel || 1;
  return Math.min(100, Math.max(10, level * 10));
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
  const { getToken, profile, userId } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [customDuration, setCustomDuration] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState(voiceOptions[0].id);
  const [visualMode, setVisualMode] = useState<EnvironmentMode>("AI Orb");
  const [conversationMode, setConversationMode] = useState<ConversationMode>("natural");
  const [voiceMode, setVoiceMode] = useState(false);
  const [cameraAssistedTiming, setCameraAssistedTiming] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(profile?.privacySettings || defaultPrivacySettings);
  const [latestHint, setLatestHint] = useState<SessionHint | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [latestControl, setLatestControl] = useState<ConversationControl | null>(null);
  const [autoSubmitNotice, setAutoSubmitNotice] = useState("");
  const [pauseDecision, setPauseDecision] = useState<PauseFusionDecision | null>(null);
  const autoEndingRef = useRef(false);
  const heldVoiceTurnRef = useRef<{ content: string; speechDurationMs: number; silenceMs: number } | null>(null);
  const practiceLanguage = getLanguage(session?.practiceLanguage);
  const beginnerMode = session?.difficulty === "Beginner" || session?.difficulty === "Friendly";
  const coordination = useConversationCoordination({ userId, sessionId: id, enabled: voiceMode });
  const { analyze: analyzeCoordination } = coordination;
  const voice = useRealtimeVoice({ browserSpeechCode: practiceLanguage.browserSpeechCode, deepgramCode: practiceLanguage.deepgramCode, longPauseMs: coordination.longPauseMs || 3400 });
  const cameraSignals = useLocalCameraSignals({ enabled: cameraAssistedTiming });
  const naturalConversation = useNaturalConversation();
  const naturalModeActive = conversationMode === "natural";

  useEffect(() => {
    if (!profile?.privacySettings) return;
    setPrivacySettings(normalizePrivacySettings(profile.privacySettings));
    setCameraAssistedTiming(Boolean(profile.privacySettings.allowCameraAssistedTiming));
  }, [profile?.privacySettings]);

  useEffect(() => {
    if (!userId || userId === "guest") return;
    getToken()
      .then((token) => getTelemetryConsent(userId, token))
      .then((settings) => {
        const nextSettings = normalizePrivacySettings(settings);
        setPrivacySettings(nextSettings);
        setCameraAssistedTiming(Boolean(nextSettings.allowCameraAssistedTiming));
      })
      .catch(() => undefined);
  }, [getToken, userId]);

  useEffect(() => {
    if (!id) {
      setError("Missing session id.");
      return;
    }
    getToken()
      .then((token: string | null) => getSession(id, token))
      .then((data: { session: Session; messages: Message[] }) => {
        setSession(data.session);
        setVisualMode(data.session.environmentMode || "AI Orb");
        setConversationMode(data.session.preferredConversationMode || "natural");
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
      if (!naturalModeActive) setDraft(`${voice.transcript} ${voice.interimTranscript}`.trim());
      analyzeCoordination({
        transcript: voice.transcript,
        interimTranscript: voice.interimTranscript,
        silenceMs: 0,
      });
      if (naturalModeActive && voice.isSpeaking) {
        voice.stopSpeaking();
        naturalConversation.dispatch("interrupt");
        setAutoSubmitNotice("You interrupted the AI");
      } else if (naturalModeActive) {
        naturalConversation.dispatch("speech_detected");
      }
    }
  }, [analyzeCoordination, naturalConversation, naturalModeActive, voice, voice.transcript, voice.interimTranscript]);

  useEffect(() => {
    return voice.onFinalTranscript((nextTranscript, metrics) => {
      if (!voiceMode || loading) return;
      if (naturalModeActive) {
        submitContent(nextTranscript, true, metrics);
        return;
      }
      setDraft(nextTranscript);
    });
  }, [voice.onFinalTranscript, voiceMode, loading, naturalModeActive]);

  useEffect(() => {
    if (!voiceMode || !naturalModeActive || loading || voice.isSpeaking || naturalConversation.state === "paused") return;
    if (voice.supported && voice.voiceState === "idle") voice.startListening();
    return () => {
      if (!voiceMode) voice.stopListening();
    };
  }, [voiceMode, naturalModeActive, loading, voice.isSpeaking, voice.supported, voice.voiceState, voice.startListening, voice.stopListening, naturalConversation.state]);

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
    setAutoSubmitNotice(fromVoice ? "Checking whether to wait..." : "");
    if (session?.status === "completed") {
      setVoiceMode(false);
      voice.stopListening();
      setAutoSubmitNotice("");
      setError("This session is already completed. Start a new practice session for hands-free voice.");
      return;
    }
    let outboundContent = content.trim();
    let metrics = voiceMetrics || { speechDurationMs: 0, silenceMs: 0 };
    let localDecision: PauseFusionDecision | null = null;
    if (fromVoice) {
      if (naturalModeActive) naturalConversation.dispatch("silence_detected");
      const held = heldVoiceTurnRef.current;
      outboundContent = [held?.content, content.trim()].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
      metrics = {
        speechDurationMs: (held?.speechDurationMs || 0) + (voiceMetrics?.speechDurationMs || 0),
        silenceMs: Math.max(held?.silenceMs || 0, voiceMetrics?.silenceMs || 0),
      };
      const naturalDecision = naturalConversation.evaluateTurn({
        finalTranscript: outboundContent,
        interimTranscript: voice.interimTranscript,
        speechDurationMs: metrics.speechDurationMs,
        silenceMs: metrics.silenceMs,
        deepgramEndpointing: voice.provider === "deepgram",
        cameraSignals: cameraAssistedTiming ? cameraSignals.signals : null,
        personalBaseline: coordination.profile || undefined,
        aiSpeaking: voice.isSpeaking,
      });
      localDecision = naturalDecision.sourceDecision || pauseFusionEngine(
          {
            finalTranscript: outboundContent,
            interimTranscript: voice.interimTranscript,
            speechDurationMs: metrics.speechDurationMs,
            silenceMs: metrics.silenceMs,
            deepgramEndpointing: voice.provider === "deepgram",
          },
          cameraAssistedTiming ? cameraSignals.signals : null,
          coordination.profile || undefined,
        );
      setPauseDecision(localDecision);
      if (privacySettings.allowLocalSignalTelemetry) {
        const token = await getToken();
        saveLocalSignalTelemetry({
          userId,
          sessionId: id,
          cameraEnabled: cameraAssistedTiming,
          faceDetected: cameraSignals.signals.faceDetected,
          mouthMovementActivity: cameraSignals.signals.mouthMovementIntensity,
          visualStillnessMs: cameraSignals.signals.visualStillnessMs,
          lookingAwayScore: cameraSignals.signals.lookingAwayScore,
          headMovementIntensity: cameraSignals.signals.headMovementIntensity,
          silenceMs: metrics.silenceMs,
          speechDurationMs: metrics.speechDurationMs,
          pauseDecision: localDecision.pauseDecision,
          decisionConfidence: localDecision.confidence,
          userContinuedAfterDecision: localDecision.pauseDecision !== "respond",
        }, token).catch(() => undefined);
      }
      if (naturalDecision.decision === "wait_longer" || naturalDecision.decision === "keep_listening") {
        heldVoiceTurnRef.current = { content: outboundContent, ...metrics };
        setDraft(outboundContent);
        setAutoSubmitNotice(localDecision.reason === "visual_preparing_to_continue" ? "Still listening. Take your time." : "Waiting a little longer.");
        window.setTimeout(() => {
          if (voiceMode && !loading && session?.status !== "completed") voice.startListening();
        }, Math.min(1400, Math.max(500, Math.round(localDecision.adjustedWaitMs * 0.22))));
        return;
      }
      if (naturalDecision.decision === "gentle_prompt") {
        heldVoiceTurnRef.current = { content: outboundContent, ...metrics };
        setDraft(outboundContent);
        setAutoSubmitNotice("Take your time — when you’re ready, continue.");
        window.setTimeout(() => {
          if (voiceMode && !loading && session?.status !== "completed") voice.startListening();
        }, 1300);
        return;
      }
    }
    heldVoiceTurnRef.current = null;
    setDraft("");
    voice.resetTranscript();
    if (fromVoice && naturalModeActive) naturalConversation.dispatch("ai_processing");
    setLoading(true);
    try {
      const token = await getToken();
      const requestStartedAt = Date.now();
      const result = await sendMessage(id, outboundContent, userId, token, {
        transcript: outboundContent,
        interimTranscript: "",
        speechDurationMs: metrics.speechDurationMs,
        silenceMs: metrics.silenceMs,
        sessionId: id,
        userId,
        conversationMode: fromVoice && naturalModeActive ? "natural" : "manual",
        turnTiming: {
          silenceMs: metrics.silenceMs,
          speechDurationMs: metrics.speechDurationMs,
          autoSubmitted: Boolean(fromVoice && naturalModeActive),
          cameraAssisted: Boolean(localDecision?.cameraAssisted),
          pauseDecision: localDecision?.pauseDecision,
          interruptionDetected: naturalConversation.state === "user_interrupting",
        },
        coordinationContext: localDecision ? {
          pauseDecision: localDecision.pauseDecision,
          userStateApprox: localDecision.userStateApprox,
          adjustedWaitMs: localDecision.adjustedWaitMs,
          cameraAssisted: localDecision.cameraAssisted,
          cameraHesitation: cameraAssistedTiming && (cameraSignals.signals.visualStillnessMs > 2600 || cameraSignals.signals.lookingAwayScore > 0.65),
        } : undefined,
      });
      const responseLatencyMs = Date.now() - requestStartedAt;
      setMessages((current) => [...current, result.userMessage, result.aiMessage]);
      setSession((current) => current ? { ...current, turnCount: result.turnCount } : current);
      if (result.conversationControl) {
        setLatestControl(result.conversationControl);
        setSession((current) => current ? { ...current, pressureLevel: result.conversationControl?.pressureLevel || current.pressureLevel } : current);
      }
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
          transcript: outboundContent,
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
          aiInterruptedUser: localDecision ? localDecision.pauseDecision === "respond" && localDecision.reason !== "user_finished" : Boolean(coordination.state?.shouldAiInterrupt),
          cameraEnabled: cameraAssistedTiming,
          faceDetected: cameraSignals.signals.faceDetected,
          mouthMovementActivity: cameraSignals.signals.mouthMovementIntensity,
          visualStillnessMs: cameraSignals.signals.visualStillnessMs,
          lookingAwayScore: cameraSignals.signals.lookingAwayScore,
          headMovementIntensity: cameraSignals.signals.headMovementIntensity,
          pauseDecision: localDecision?.pauseDecision,
          decisionConfidence: localDecision?.confidence,
        }, token).catch(() => undefined);
      }
      if (fromVoice && naturalModeActive) naturalConversation.dispatch("ai_speaking");
      await voice.speak(result.aiMessage.content, selectedVoiceId || undefined, practiceLanguage.browserSpeechCode);
      if (fromVoice && naturalModeActive) naturalConversation.dispatch("ai_finished");
      if (fromVoice && voiceMode && naturalModeActive) voice.startListening();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send your response.";
      if (message.includes("Session already completed")) {
        setVoiceMode(false);
        voice.stopListening();
        setSession((current) => current ? { ...current, status: "completed" } : current);
        setError("This session is already completed. Start a new practice session for hands-free voice.");
      } else {
        if (fromVoice && naturalModeActive) naturalConversation.dispatch("error");
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

  function startNaturalConversation() {
    setError("");
    setConversationMode("natural");
    setVoiceMode(true);
    naturalConversation.dispatch("start");
    if (session?.status === "completed") {
      naturalConversation.dispatch("error");
      return;
    }
    const hasUserTurn = messages.some((message) => message.role === "user");
    const openingMessage = !hasUserTurn ? messages.find((message) => message.role === "ai")?.content : "";
    naturalConversation.dispatch("ai_speaking");
    voice.speak(openingMessage || listeningPrompts[practiceLanguage.code] || listeningPrompts.en, selectedVoiceId || undefined, practiceLanguage.browserSpeechCode)
      .then(() => {
        naturalConversation.dispatch("listening_started");
        voice.startListening();
      })
      .catch(() => {
        naturalConversation.dispatch("error");
        setError("Natural conversation paused. Switch to manual mode?");
      });
  }

  function pauseNaturalConversation() {
    setVoiceMode(false);
    naturalConversation.dispatch("pause");
    voice.stopListening();
    voice.stopSpeaking();
  }

  function resumeNaturalConversation() {
    setError("");
    setVoiceMode(true);
    naturalConversation.dispatch("resume");
    voice.startListening();
  }

  function switchToManualMode() {
    setConversationMode("manual");
    setVoiceMode(false);
    naturalConversation.reset();
    voice.stopListening();
    voice.stopSpeaking();
  }

  async function updateCameraAssistance(enabled: boolean) {
    setCameraAssistedTiming(enabled);
    if (!enabled) cameraSignals.stop();
    const current = privacySettings || defaultPrivacySettings;
    const nextSettings = normalizePrivacySettings({ ...current, allowCameraAssistedTiming: enabled });
    setPrivacySettings(nextSettings);
    const token = await getToken();
    const saved = await updateTelemetryConsent(userId, nextSettings, token).catch(() => null);
    if (saved) setPrivacySettings(normalizePrivacySettings(saved));
  }

  async function finish() {
    setError("");
    voice.stopListening();
    voice.stopSpeaking();
    naturalConversation.reset();
    setVoiceMode(false);
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
            <label className="hidden items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-xs font-semibold text-white/70 ring-1 ring-white/12 backdrop-blur-2xl xl:flex">
              <Camera size={14} />
              <span>Camera-assisted timing</span>
              <input
                type="checkbox"
                checked={cameraAssistedTiming}
                onChange={(event) => updateCameraAssistance(event.target.checked).catch(() => undefined)}
                className="size-4 accent-cyan-200"
              />
            </label>
            <label className="hidden items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-xs font-semibold text-white/70 ring-1 ring-white/12 backdrop-blur-2xl lg:flex">
              <UsersRound size={14} />
              <select
                value={visualMode}
                onChange={(event) => setVisualMode(event.target.value as EnvironmentMode)}
                className="max-w-44 bg-transparent text-white outline-none [color-scheme:dark]"
                aria-label="Visual room"
              >
                {environmentModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
              </select>
            </label>
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

        <div className="mt-3 grid gap-2 text-xs font-semibold text-white/70 lg:hidden">
          <label className="flex items-center justify-between rounded-full bg-white/[0.08] px-4 py-3 ring-1 ring-white/12 backdrop-blur-2xl">
            <span className="inline-flex items-center gap-2"><UsersRound size={14} /> Room</span>
            <select
              value={visualMode}
              onChange={(event) => setVisualMode(event.target.value as EnvironmentMode)}
              className="max-w-[62vw] bg-transparent text-right text-white outline-none [color-scheme:dark]"
              aria-label="Visual room"
            >
              {environmentModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </label>
        </div>

        <section className={`relative grid flex-1 place-items-center py-8 ${visualMode !== "AI Orb" ? "min-h-[680px]" : ""}`}>
          {visualMode === "AI Orb" ? (
            <AIPresenceOrb state={orbMode} intensity={(session?.turnCount || 0) / 8} />
          ) : (
            <AICharacterEnvironment mode={visualMode} />
          )}
          <div className="absolute left-0 top-8 hidden max-w-xs space-y-3 lg:block">
            <MicroMetric label="Confidence" value={voice.isListening ? 74 : 68} tone="bg-cyan-300 text-cyan-300" />
            <MicroMetric label="Reasoning stability" value={loading ? 61 : 82} tone="bg-violet-300 text-violet-300" />
          </div>
          <div className="absolute right-0 top-20 hidden max-w-xs space-y-3 lg:block">
            <MicroMetric label="Pressure" value={pressurePercent(latestControl || coordination.state?.conversationControl, session)} tone="bg-rose-300 text-rose-300" />
            <MicroMetric label="Stance" value={latestControl?.stance === "supportive" ? 28 : latestControl?.stance === "curious" ? 42 : latestControl?.stance === "skeptical" ? 68 : latestControl?.stance === "opposing" || latestControl?.stance === "hostile" ? 88 : 52} tone="bg-amber-200 text-amber-200" />
            <MicroMetric label="Recovery" value={voice.isSpeaking ? 78 : 71} tone="bg-emerald-300 text-emerald-300" />
          </div>

          <div className={`relative z-10 w-full max-w-4xl text-center ${visualMode !== "AI Orb" ? "pt-[29rem]" : ""}`}>
            <div className="mx-auto mb-3 w-fit rounded-full bg-white/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/76 ring-1 ring-white/12 backdrop-blur-2xl">
              {voice.provider === "deepgram" ? "Deepgram live" : "Browser fallback"} · {practiceLanguage.nativeName} · {session?.difficulty || "Realistic"}{session?.difficulty === "Nerve" ? ` · pressure ${session.pressureLevel || 1}/10` : ""}
            </div>
            <div className="mx-auto mb-4 flex w-fit flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1.5 text-xs font-bold text-white/62 ring-1 ring-white/12 backdrop-blur-2xl">
                <BrainCircuit size={14} /> {stanceLabel(latestControl || coordination.state?.conversationControl)} · pressure {latestControl?.pressureLevel || coordination.state?.pressureLevel || session?.pressureLevel || 1}/10
              </div>
              {session?.difficulty === "Nerve" && (
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-300/12 px-3 py-1.5 text-xs font-bold text-rose-50 ring-1 ring-rose-200/20 backdrop-blur-2xl">
                  <UsersRound size={14} /> Panel mode
                </div>
              )}
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 backdrop-blur-2xl ${cameraAssistedTiming ? "bg-emerald-300/12 text-emerald-50 ring-emerald-200/20" : "bg-white/[0.08] text-white/50 ring-white/12"}`}>
                <ShieldCheck size={14} /> {cameraAssistedTiming ? cameraSignals.message : "Camera assistance is off."} {cameraAssistedTiming && <span className="rounded-full bg-white/10 px-2 py-0.5">local only</span>}
              </div>
              {cameraAssistedTiming && (
                <button type="button" onClick={() => cameraSignals.setPreviewVisible(!cameraSignals.previewVisible)} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-xs font-bold text-white/64 ring-1 ring-white/12">
                  {cameraSignals.previewVisible ? <EyeOff size={14} /> : <Eye size={14} />} Preview
                </button>
              )}
            </div>
            {cameraAssistedTiming && (
              <div className={cameraSignals.previewVisible ? "mx-auto mb-4 w-44 overflow-hidden rounded-2xl bg-black/50 ring-1 ring-white/15" : "sr-only"}>
                <video ref={cameraSignals.videoRef} className="aspect-video w-full object-cover opacity-80" muted playsInline />
              </div>
            )}
            <h1 className="mx-auto -mt-3 max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl">
              {session?.practiceType || "Cognitive simulation"}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-white/56 sm:text-lg">
              {naturalModeActive && voiceMode ? autoSubmitNotice || (naturalConversation.state === "user_thinking" ? "Thinking. You may continue..." : naturalConversation.state === "processing_ai" || naturalConversation.state === "ready_to_send" ? "Sending your answer..." : naturalConversation.state === "ai_speaking" ? "AI responding..." : naturalConversation.state === "user_interrupting" ? "You interrupted the AI" : stateCopy(orbMode, voiceMode, autoSubmitNotice)) : stateCopy(orbMode, voiceMode, autoSubmitNotice)}
            </p>
            {beginnerMode && session && messages.length === 0 && (
              <div className="mt-8 grid gap-4 text-left">
                <BeginnerBriefing session={session} />
                <ConversationMap session={session} />
              </div>
            )}
            {beginnerMode && (latestControl?.shouldSupport || coordination.state?.conversationControl?.shouldSupport) && (
              <div className="mx-auto mt-5 max-w-xl rounded-[1.25rem] bg-cyan-100/[0.08] px-4 py-3 text-sm font-semibold text-cyan-50/76 ring-1 ring-cyan-100/15 backdrop-blur-2xl">
                Try a smaller answer: claim first, then one piece of evidence.
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

          <LiveTranscriptPanel transcript={voice.transcript} interimTranscript={voice.interimTranscript} />

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
            <div className="mb-3">
              <ConversationModeToggle
                value={conversationMode}
                onChange={(mode) => {
                  if (mode === "manual") switchToManualMode();
                  else {
                    setConversationMode("natural");
                    setVoiceMode(false);
                    voice.stopListening();
                    voice.stopSpeaking();
                    naturalConversation.reset();
                  }
                }}
                disabled={loading}
              />
            </div>
            <div className="mb-3 grid gap-2 text-xs font-semibold text-white/70 xl:hidden">
              <label className="flex items-center justify-between rounded-full bg-white/[0.08] px-4 py-3 ring-1 ring-white/12 backdrop-blur-2xl">
                <span className="inline-flex items-center gap-2"><Camera size={14} /> Camera-assisted timing</span>
                <input
                  type="checkbox"
                  checked={cameraAssistedTiming}
                  onChange={(event) => updateCameraAssistance(event.target.checked).catch(() => undefined)}
                  className="size-4 accent-cyan-200"
                />
              </label>
            </div>
            {cameraAssistedTiming && <CameraPrivacyNotice compact className="mb-3 bg-white/[0.08] text-white/70 ring-white/12 dark:bg-white/[0.08] dark:text-white/70 dark:ring-white/12" />}
            {naturalModeActive ? (
              <NaturalConversationControls
                state={naturalConversation.state}
                supported={voice.supported}
                disabled={loading || session?.status === "completed"}
                onStart={startNaturalConversation}
                onPause={pauseNaturalConversation}
                onResume={resumeNaturalConversation}
                onEnd={finish}
                onSwitchToManual={switchToManualMode}
              />
            ) : (
              <>
                <form onSubmit={onSubmit} className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setVoiceMode(true);
                      voice.startListening();
                    }}
                    disabled={!voice.supported || voiceMode || session?.status === "completed"}
                    className="grid size-14 shrink-0 place-items-center rounded-full bg-white/[0.10] text-white ring-1 ring-white/12 transition disabled:opacity-45"
                    aria-label="Start microphone"
                  >
                    <Mic size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceMode(false);
                      voice.stopListening();
                    }}
                    disabled={!voiceMode}
                    className="grid size-14 shrink-0 place-items-center rounded-full bg-white/[0.10] text-white ring-1 ring-white/12 transition disabled:opacity-45"
                    aria-label="Stop microphone"
                  >
                    <MicOff size={22} />
                  </button>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={1}
                    className="max-h-32 min-h-14 min-w-0 flex-1 resize-none rounded-[1.35rem] border border-white/10 bg-white/[0.07] px-4 py-4 text-base font-medium text-white outline-none transition placeholder:text-white/32 focus:border-cyan-200/40 focus:ring-4 focus:ring-cyan-200/10"
                    placeholder="Speak or type your response..."
                  />
                  <button className="grid size-14 shrink-0 place-items-center rounded-full bg-white text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.16)] transition hover:scale-105">
                    <Send size={20} />
                  </button>
                </form>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-xs font-semibold text-white/42">
                  <span className="inline-flex items-center gap-2"><Volume2 size={14} /> Manual mode is ready</span>
                  <button onClick={finish} disabled={loading} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-rose-100 transition hover:bg-rose-300/10 disabled:opacity-60">
                    <Square size={13} /> End and generate report
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </AnimatedPage>
    </main>
  );
}
