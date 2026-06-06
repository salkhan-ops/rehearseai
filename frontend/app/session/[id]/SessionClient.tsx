"use client";

import { motion } from "framer-motion";
import { ArrowLeft, BrainCircuit, Camera, Clock3, Eye, EyeOff, Mic, MicOff, Send, Square, UsersRound, Volume2 } from "lucide-react";
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
import { CameraAssistedTimingToggle } from "@/components/session/CameraAssistedTimingToggle";
import { CameraDebugPanel } from "@/components/session/CameraDebugPanel";
import { CameraTimingStatus } from "@/components/session/CameraTimingStatus";
import { ConversationModeToggle } from "@/components/session/ConversationModeToggle";
import { LiveTranscriptPanel } from "@/components/session/LiveTranscriptPanel";
import { NaturalConversationControls } from "@/components/session/NaturalConversationControls";
import { useConversationCoordination } from "@/hooks/useConversationCoordination";
import { useLocalCameraSignals } from "@/hooks/useLocalCameraSignals";
import { useNaturalConversation } from "@/hooks/useNaturalConversation";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import { completeCourseSession, endSession, generateReport, getSession, sendMessage, updateSessionHint } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FORCE_DECISION_MS, HARD_TIMEOUT_MS, SOFT_PROMPT_MS } from "@/lib/conversation/naturalTurnTakingEngine";
import { getLanguage, isRtlLanguage } from "@/lib/languages";
import { pauseFusionEngine } from "@/lib/local-signals/pauseFusionEngine";
import { stopCamera as stopMediaPipeCamera } from "@/lib/mediapipe/faceLandmarkerService";
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
  const [naturalCountdown, setNaturalCountdown] = useState<number | null>(null);
  const [turnDebug, setTurnDebug] = useState<Record<string, string | number | boolean>>({});
  const [pauseDecision, setPauseDecision] = useState<PauseFusionDecision | null>(null);
  const autoEndingRef = useRef(false);
  const heldVoiceTurnRef = useRef<{ content: string; speechDurationMs: number; silenceMs: number } | null>(null);
  const naturalTranscriptRef = useRef("");
  const naturalMetricsRef = useRef<{ speechDurationMs: number; silenceMs: number }>({ speechDurationMs: 0, silenceMs: 0 });
  const naturalLastTranscriptUpdateAtRef = useRef(0);
  const naturalDeepgramFinalReceivedRef = useRef(false);
  const isFinalizingTurnRef = useRef(false);
  const sessionActiveRef = useRef(true);
  const debugTurnTaking = process.env.NEXT_PUBLIC_DEBUG_TURN_TAKING === "true";
  const naturalTimerRefs = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const naturalIntervalRefs = useRef<Array<ReturnType<typeof setInterval>>>([]);
  const naturalGentlePromptShownRef = useRef(false);
  const latestVoiceModeRef = useRef(false);
  const latestLoadingRef = useRef(false);
  const stopChamberMediaRef = useRef<() => void>(() => undefined);
  const practiceLanguage = getLanguage(session?.practiceLanguage);
  const beginnerMode = session?.difficulty === "Beginner" || session?.difficulty === "Friendly";
  const coordination = useConversationCoordination({ userId, sessionId: id, enabled: voiceMode });
  const { analyze: analyzeCoordination } = coordination;
  const voice = useRealtimeVoice({ browserSpeechCode: practiceLanguage.browserSpeechCode, deepgramCode: practiceLanguage.deepgramCode, longPauseMs: coordination.longPauseMs || 3400 });
  const naturalTranscriptForCamera = (naturalTranscriptRef.current || voice.transcript || heldVoiceTurnRef.current?.content || "").replace(/\s+/g, " ").trim();
  const cameraSignals = useLocalCameraSignals({
    enabled: cameraAssistedTiming,
    transcriptStableMs: naturalLastTranscriptUpdateAtRef.current ? Date.now() - naturalLastTranscriptUpdateAtRef.current : 0,
    silenceMs: naturalMetricsRef.current.silenceMs || 0,
    hasTranscript: naturalTranscriptForCamera.length >= 12 || naturalTranscriptForCamera.split(" ").filter(Boolean).length >= 2,
  });
  const naturalConversation = useNaturalConversation();
  const naturalModeActive = conversationMode === "natural";

  useEffect(() => {
    latestVoiceModeRef.current = voiceMode;
  }, [voiceMode]);

  useEffect(() => {
    latestLoadingRef.current = loading;
  }, [loading]);

  function clearNaturalTimers() {
    naturalTimerRefs.current.forEach((timer) => clearTimeout(timer));
    naturalIntervalRefs.current.forEach((timer) => clearInterval(timer));
    naturalTimerRefs.current = [];
    naturalIntervalRefs.current = [];
    setNaturalCountdown(null);
  }

  function meaningfulTurn(content: string) {
    const normalized = content.replace(/\s+/g, " ").trim();
    return normalized.split(" ").filter(Boolean).length >= 2 || normalized.length >= 12;
  }

  function cameraTurnSignal() {
    if (!cameraAssistedTiming) return "no_signal";
    if (cameraSignals.conversationSignal.recommendedAction === "send_now") return "likely_finished";
    if (cameraSignals.conversationSignal.recommendedAction === "continue_listening" || cameraSignals.conversationSignal.recommendedAction === "wait_longer") return "likely_thinking";
    if (!cameraSignals.signals.faceDetected) return "face_not_detected";
    const likelyThinking =
      cameraSignals.signals.mouthMovementIntensity > 0.14 ||
      cameraSignals.signals.headMovementIntensity > 0.12 ||
      cameraSignals.signals.gazeShiftFrequency > 0.1 ||
      cameraSignals.signals.lookingAwayScore > 0.42;
    const likelyFinished =
      cameraSignals.signals.mouthMovementIntensity < 0.08 &&
      cameraSignals.signals.headMovementIntensity < 0.08 &&
      cameraSignals.signals.visualStillnessMs > 1200;
    if (likelyFinished) return "likely_finished";
    if (likelyThinking) return "likely_thinking";
    return "no_signal";
  }

  function naturalTimeoutPrompt(kind: "soft" | "hard") {
    const difficulty = session?.difficulty || "Intermediate";
    if (difficulty === "Beginner" || difficulty === "Friendly") {
      return kind === "hard" ? "Let me reframe the question. What evidence supports your point?" : "Take your time — you can think out loud.";
    }
    if (difficulty === "Brutal") {
      return kind === "hard" ? "You’re hesitating. Give me a direct answer." : "";
    }
    if (difficulty === "Nerve") {
      return kind === "hard" ? "Panelist: You’ve had enough time. What is your answer?" : "You’ve had some time. Defend your answer.";
    }
    if (difficulty === "Advanced") return kind === "hard" ? "Give me your strongest point first." : "Whenever you’re ready, continue.";
    return kind === "hard" ? "Start with one reason." : "Whenever you’re ready, continue.";
  }

  function startCountdown(fromMs: number, totalMs: number) {
    const secondsLeft = Math.max(1, Math.ceil((totalMs - fromMs) / 1000));
    setNaturalCountdown(Math.min(3, secondsLeft));
    const interval = setInterval(() => {
      setNaturalCountdown((current) => {
        if (!current || current <= 1) return null;
        return current - 1;
      });
    }, 1000);
    naturalIntervalRefs.current.push(interval);
  }

  function scheduleNaturalAutoFinalize(reason: string, delayMs: number, maxDelayMs = HARD_TIMEOUT_MS) {
    clearNaturalTimers();
    const boundedDelay = Math.max(0, Math.min(delayMs, maxDelayMs));
    if (boundedDelay >= SOFT_PROMPT_MS) startCountdown(SOFT_PROMPT_MS, boundedDelay);
    const timer = setTimeout(() => finalizeAndSendTurn(reason), boundedDelay);
    naturalTimerRefs.current.push(timer);
  }

  async function finalizeAndSendTurn(reason = "auto_send") {
    if (!sessionActiveRef.current || !naturalModeActive || !latestVoiceModeRef.current || latestLoadingRef.current || isFinalizingTurnRef.current) return;
    const content = (naturalTranscriptRef.current || heldVoiceTurnRef.current?.content || draft || voice.transcript || "").replace(/\s+/g, " ").trim();
    clearNaturalTimers();
    if (!meaningfulTurn(content)) {
      heldVoiceTurnRef.current = null;
      naturalTranscriptRef.current = "";
      naturalDeepgramFinalReceivedRef.current = false;
      setDraft("");
      voice.resetTranscript();
      setAutoSubmitNotice("I didn’t catch that. Please try again.");
      naturalConversation.dispatch("listening_started");
      if (sessionActiveRef.current && latestVoiceModeRef.current && session?.status !== "completed") {
        window.setTimeout(() => {
          if (sessionActiveRef.current && latestVoiceModeRef.current) {
            voice.startListening();
            scheduleNaturalBoundedWait(0, false);
          }
        }, 800);
      }
      return;
    }

    isFinalizingTurnRef.current = true;
    setAutoSubmitNotice("Moving forward...");
    naturalConversation.dispatch("send_ready");
    await sendNaturalTurnDirect(content, reason).finally(() => {
      isFinalizingTurnRef.current = false;
      naturalTranscriptRef.current = "";
      naturalDeepgramFinalReceivedRef.current = false;
      naturalLastTranscriptUpdateAtRef.current = 0;
    });
  }

  function forceResolveNaturalTurn(reason: "send_now" | "force_resolution" | "hard_timeout" = "force_resolution") {
    naturalMetricsRef.current = {
      speechDurationMs: heldVoiceTurnRef.current?.speechDurationMs || naturalMetricsRef.current.speechDurationMs || 0,
      silenceMs: reason === "hard_timeout" ? HARD_TIMEOUT_MS : FORCE_DECISION_MS,
    };
    finalizeAndSendTurn(reason).catch(() => undefined);
  }

  function scheduleNaturalBoundedWait(elapsedSilenceMs: number, hasContent: boolean) {
    clearNaturalTimers();
    if (!naturalModeActive) return;
    const softDelay = Math.max(0, SOFT_PROMPT_MS - elapsedSilenceMs);
    const forceDelay = Math.max(0, FORCE_DECISION_MS - elapsedSilenceMs);
    const hardDelay = Math.max(0, HARD_TIMEOUT_MS - elapsedSilenceMs);

    if (!naturalGentlePromptShownRef.current && softDelay <= hardDelay) {
      const softTimer = setTimeout(() => {
        naturalGentlePromptShownRef.current = true;
        const prompt = naturalTimeoutPrompt("soft");
        if (prompt) setAutoSubmitNotice(prompt);
        startCountdown(SOFT_PROMPT_MS, hasContent ? FORCE_DECISION_MS : HARD_TIMEOUT_MS);
      }, softDelay);
      naturalTimerRefs.current.push(softTimer);
    }

    if (hasContent) {
      const forceTimer = setTimeout(() => forceResolveNaturalTurn("force_resolution"), Math.min(forceDelay, 6000));
      naturalTimerRefs.current.push(forceTimer);
    }

    const hardTimer = setTimeout(() => forceResolveNaturalTurn("hard_timeout"), hardDelay);
    naturalTimerRefs.current.push(hardTimer);
  }

  function stopChamberMedia() {
    sessionActiveRef.current = false;
    setVoiceMode(false);
    clearNaturalTimers();
    heldVoiceTurnRef.current = null;
    naturalTranscriptRef.current = "";
    naturalDeepgramFinalReceivedRef.current = false;
    isFinalizingTurnRef.current = false;
    naturalConversation.reset();
    voice.stopListening();
    voice.stopSpeaking();
    voice.resetTranscript();
    cameraSignals.stop();
    stopMediaPipeCamera();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }

  stopChamberMediaRef.current = stopChamberMedia;

  function exitChamber() {
    stopChamberMediaRef.current();
    router.push("/practice");
  }

  async function sendNaturalTurnDirect(content: string, reason: string) {
    const outboundContent = content.replace(/\s+/g, " ").trim();
    if (!meaningfulTurn(outboundContent) || session?.status === "completed") return;
    const metrics = naturalMetricsRef.current || { speechDurationMs: 0, silenceMs: 0 };
    const cameraSignal = cameraTurnSignal();
    clearNaturalTimers();
    voice.stopListening();
    voice.resetTranscript();
    setDraft("");
    setLoading(true);
    setError("");
    naturalConversation.dispatch("ai_processing");
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
        conversationMode: "natural",
        turnTiming: {
          silenceMs: metrics.silenceMs,
          speechDurationMs: metrics.speechDurationMs,
          autoSubmitted: true,
          cameraAssisted: cameraSignal !== "no_signal" && cameraSignal !== "face_not_detected",
          pauseDecision: reason,
          interruptionDetected: naturalConversation.state === "user_interrupting",
          gentlePromptShown: naturalGentlePromptShownRef.current,
          forceResolutionTriggered: reason === "force_resolution" || reason === "hard_timeout" || reason === "camera_delay_elapsed",
          hardTimeoutTriggered: reason === "hard_timeout",
        },
        coordinationContext: {
          pauseDecision: "respond",
          userStateApprox: "finished",
          adjustedWaitMs: metrics.silenceMs,
          cameraAssisted: cameraSignal !== "no_signal" && cameraSignal !== "face_not_detected",
          cameraHesitation: cameraSignals.conversationSignal.recommendedAction === "wait_longer" || cameraSignals.conversationSignal.recommendedAction === "continue_listening",
        },
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
          userInterruptedAi: false,
          aiInterruptedUser: false,
          cameraEnabled: cameraAssistedTiming,
          faceDetected: cameraSignals.signals.faceDetected,
          mouthMovementActivity: cameraSignals.signals.mouthMovementIntensity,
          visualStillnessMs: cameraSignals.signals.visualStillnessMs,
          lookingAwayScore: cameraSignals.signals.lookingAwayScore,
          headMovementIntensity: cameraSignals.signals.headMovementIntensity,
          pauseDecision: "respond",
          decisionConfidence: 0.98,
        }, token).catch(() => undefined);
      }
      naturalConversation.dispatch("ai_speaking");
      setAutoSubmitNotice("AI responding...");
      await voice.speak(result.aiMessage.content, selectedVoiceId || undefined, practiceLanguage.browserSpeechCode);
      naturalConversation.dispatch("ai_finished");
      if (sessionActiveRef.current && latestVoiceModeRef.current && naturalModeActive) {
        voice.startListening();
        scheduleNaturalBoundedWait(0, false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send your response.";
      naturalConversation.dispatch("error");
      setError(message);
    } finally {
      naturalGentlePromptShownRef.current = false;
      setAutoSubmitNotice("");
      setLoading(false);
    }
  }

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

  useEffect(() => {
    sessionActiveRef.current = true;
    const handlePageHide = () => stopChamberMediaRef.current();
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      stopChamberMediaRef.current();
    };
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
      const liveTranscript = `${voice.transcript} ${voice.interimTranscript}`.replace(/\s+/g, " ").trim();
      if (!naturalModeActive) setDraft(liveTranscript);
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
        clearNaturalTimers();
        naturalTranscriptRef.current = liveTranscript || naturalTranscriptRef.current;
        naturalLastTranscriptUpdateAtRef.current = Date.now();
        naturalConversation.dispatch("speech_detected");
        if (meaningfulTurn(naturalTranscriptRef.current)) {
          const cameraSignal = cameraTurnSignal();
          const delayMs = cameraSignal === "likely_thinking" ? 5000 : cameraSignal === "likely_finished" ? 1200 : 3500;
          scheduleNaturalAutoFinalize("stable_transcript", delayMs, 6000);
        }
      }
    }
  }, [analyzeCoordination, naturalConversation, naturalModeActive, voice, voice.transcript, voice.interimTranscript]);

  useEffect(() => {
    return voice.onFinalTranscript((nextTranscript, metrics) => {
      if (!voiceMode || loading) return;
      if (naturalModeActive) {
        const transcript = nextTranscript.replace(/\s+/g, " ").trim();
        naturalTranscriptRef.current = naturalTranscriptRef.current.includes(transcript)
          ? naturalTranscriptRef.current
          : [naturalTranscriptRef.current, transcript].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
        naturalMetricsRef.current = metrics || { speechDurationMs: 0, silenceMs: 0 };
        naturalLastTranscriptUpdateAtRef.current = Date.now();
        naturalDeepgramFinalReceivedRef.current = voice.provider === "deepgram";
        heldVoiceTurnRef.current = {
          content: naturalTranscriptRef.current,
          speechDurationMs: naturalMetricsRef.current.speechDurationMs,
          silenceMs: naturalMetricsRef.current.silenceMs,
        };
        setDraft(naturalTranscriptRef.current);
        setAutoSubmitNotice("Moving forward...");
        scheduleNaturalAutoFinalize("deepgram_final_stable", 2000, 3000);
        return;
      }
      setDraft(nextTranscript);
    });
  }, [voice.onFinalTranscript, voiceMode, loading, naturalModeActive]);

  useEffect(() => {
    if (!voiceMode || !naturalModeActive || loading || voice.isSpeaking || naturalConversation.state === "paused") return;
    if (voice.supported && voice.voiceState === "idle") {
      voice.startListening();
      scheduleNaturalBoundedWait(0, Boolean((heldVoiceTurnRef.current?.content || draft).trim()));
    }
    return () => {
      if (!voiceMode) voice.stopListening();
    };
  }, [voiceMode, naturalModeActive, loading, voice.isSpeaking, voice.supported, voice.voiceState, voice.startListening, voice.stopListening, naturalConversation.state]);

  useEffect(() => {
    if (!voiceMode || !naturalModeActive || loading || voice.isSpeaking || naturalConversation.state === "paused") return undefined;
    const interval = setInterval(() => {
      if (!sessionActiveRef.current || isFinalizingTurnRef.current || latestLoadingRef.current || !latestVoiceModeRef.current) return;
      const transcript = (naturalTranscriptRef.current || voice.transcript || heldVoiceTurnRef.current?.content || "").replace(/\s+/g, " ").trim();
      if (!meaningfulTurn(transcript)) return;

      const now = Date.now();
      if (!naturalLastTranscriptUpdateAtRef.current) naturalLastTranscriptUpdateAtRef.current = now;
      const lastUpdateAt = naturalLastTranscriptUpdateAtRef.current;
      const stableMs = now - lastUpdateAt;
      const cameraSignal = cameraTurnSignal();
      const voiceLooksSilent = voice.voiceState === "silence_detected" || voice.voiceState === "processing" || !voice.interimTranscript;
      const thresholdMs =
        cameraSignal === "likely_finished" ? 1200 :
        cameraSignal === "likely_thinking" ? 6500 :
        2500;

      if (voiceLooksSilent && stableMs >= thresholdMs) {
        naturalMetricsRef.current = {
          speechDurationMs: naturalMetricsRef.current.speechDurationMs || heldVoiceTurnRef.current?.speechDurationMs || 0,
          silenceMs: Math.max(naturalMetricsRef.current.silenceMs || 0, stableMs),
        };
        setAutoSubmitNotice("Moving forward...");
        finalizeAndSendTurn(cameraSignal === "likely_thinking" ? "camera_delay_elapsed" : "stable_transcript_watchdog").catch(() => undefined);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [voiceMode, naturalModeActive, loading, voice.isSpeaking, voice.voiceState, voice.interimTranscript, voice.transcript, naturalConversation.state, cameraAssistedTiming, cameraSignals.signals]);

  useEffect(() => {
    if (!voiceMode || !naturalModeActive || loading || voice.isSpeaking || naturalConversation.state === "paused") return;
    if (!cameraAssistedTiming || cameraSignals.conversationSignal.recommendedAction !== "send_now") return;
    if (!cameraSignals.conversationSignal.faceDetected) return;
    const transcript = (naturalTranscriptRef.current || voice.transcript || heldVoiceTurnRef.current?.content || "").replace(/\s+/g, " ").trim();
    if (!meaningfulTurn(transcript)) return;
    const now = Date.now();
    const stableMs = naturalLastTranscriptUpdateAtRef.current ? now - naturalLastTranscriptUpdateAtRef.current : 0;
    const silentEnough = !voice.interimTranscript && !["connecting", "user_speaking"].includes(voice.voiceState);
    if (!silentEnough || stableMs < 900 || isFinalizingTurnRef.current) return;
    naturalMetricsRef.current = {
      speechDurationMs: naturalMetricsRef.current.speechDurationMs || heldVoiceTurnRef.current?.speechDurationMs || 0,
      silenceMs: Math.max(naturalMetricsRef.current.silenceMs || 0, stableMs),
    };
    setAutoSubmitNotice("Camera timing: moving forward...");
    finalizeAndSendTurn("mediapipe_likely_finished").catch(() => undefined);
  }, [
    cameraAssistedTiming,
    cameraSignals.conversationSignal,
    loading,
    naturalConversation.state,
    naturalModeActive,
    voice.interimTranscript,
    voice.isSpeaking,
    voice.transcript,
    voice.voiceState,
    voiceMode,
  ]);

  useEffect(() => {
    if (!debugTurnTaking || !naturalModeActive) return undefined;
    const interval = setInterval(() => {
      const transcript = naturalTranscriptRef.current || voice.transcript || "";
      const snapshot = {
        currentState: naturalConversation.state,
        silenceMs: naturalMetricsRef.current.silenceMs || 0,
        transcriptLength: transcript.length,
        interimTranscript: voice.interimTranscript,
        finalTranscript: voice.transcript,
        lastTranscriptUpdateAt: naturalLastTranscriptUpdateAtRef.current,
        deepgramFinalReceived: naturalDeepgramFinalReceivedRef.current,
        micPermission: voice.diagnostics?.micPermission || "unknown",
        deepgramConnected: Boolean(voice.diagnostics?.deepgramConnected),
        audioChunksStreaming: voice.diagnostics?.audioChunksStreaming || 0,
        transcriptReceived: Boolean(voice.diagnostics?.transcriptReceived),
        aiResponseReceived: Boolean(voice.diagnostics?.aiResponseReceived),
        ttsStarted: Boolean(voice.diagnostics?.ttsStarted),
        ttsError: voice.diagnostics?.ttsError || "",
        cameraEnabled: cameraAssistedTiming,
        cameraPermission: cameraSignals.state,
        mediaPipeLoaded: cameraSignals.mediaPipeLoaded,
        mediaPipeCameraPermission: cameraSignals.cameraPermission,
        faceDetected: cameraSignals.faceSignalState.faceDetected,
        mouthOpenScore: Number(cameraSignals.faceSignalState.mouthOpenScore.toFixed(3)),
        lipMovementScore: Number(cameraSignals.faceSignalState.lipMovementScore.toFixed(3)),
        blinkRateApprox: Number(cameraSignals.faceSignalState.blinkRateApprox.toFixed(3)),
        lookingAway: cameraSignals.faceSignalState.lookingAway,
        lookDirection: cameraSignals.faceSignalState.lookDirection,
        headMovementIntensity: Number(cameraSignals.faceSignalState.headMovementIntensity.toFixed(3)),
        visualStillnessMs: Math.round(cameraSignals.faceSignalState.visualStillnessMs),
        engagement: cameraSignals.faceSignalState.engagement,
        userStateEstimate: cameraSignals.conversationSignal.userStateEstimate,
        recommendedAction: cameraSignals.conversationSignal.recommendedAction,
        cameraDecision: cameraTurnSignal(),
        cameraSignalState: cameraSignals.state,
        pauseDecision: pauseDecision?.pauseDecision || "",
        forceTimeoutMs: HARD_TIMEOUT_MS,
        autoSendEligible: meaningfulTurn(transcript),
        sendNowTriggered: isFinalizingTurnRef.current,
        reasonBlocked: !meaningfulTurn(transcript) ? "empty_or_too_short" : latestLoadingRef.current ? "loading" : !latestVoiceModeRef.current ? "voice_mode_off" : "",
      };
      setTurnDebug(snapshot);
      console.debug("[turn-taking]", snapshot);
    }, 500);
    return () => clearInterval(interval);
  }, [debugTurnTaking, naturalModeActive, naturalConversation.state, voice.transcript, voice.interimTranscript, voice.diagnostics, cameraAssistedTiming, cameraSignals, pauseDecision]);

  useEffect(() => {
    if (!session || session.status === "completed" || loading || autoEndingRef.current) return;
    if (seconds < durationMinutes * 60) return;
    autoEndingRef.current = true;
    setAutoSubmitNotice("Time is up. Generating your report...");
    finish();
  }, [durationMinutes, loading, seconds, session]);

  async function submitContent(
    content: string,
    fromVoice = false,
    voiceMetrics?: { speechDurationMs: number; silenceMs: number },
    naturalOptions: {
      forceNaturalSend?: boolean;
      forceResolutionTriggered?: boolean;
      hardTimeoutTriggered?: boolean;
      gentlePromptShown?: boolean;
      decisionOverride?: string;
    } = {},
  ) {
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
      const naturalDecision = naturalOptions.forceNaturalSend ? null : naturalConversation.evaluateTurn({
        finalTranscript: outboundContent,
        interimTranscript: voice.interimTranscript,
        speechDurationMs: metrics.speechDurationMs,
        silenceMs: metrics.silenceMs,
        deepgramEndpointing: voice.provider === "deepgram",
        cameraSignals: cameraAssistedTiming ? cameraSignals.signals : null,
        cameraConversationSignal: cameraAssistedTiming ? cameraSignals.conversationSignal : null,
        personalBaseline: coordination.profile || undefined,
        aiSpeaking: voice.isSpeaking,
      });
      localDecision = naturalOptions.forceNaturalSend ? {
        pauseDecision: "respond",
        confidence: 0.98,
        reason: "user_finished",
        adjustedWaitMs: metrics.silenceMs,
        userStateApprox: "finished",
        cameraAssisted: cameraAssistedTiming && cameraSignals.signals.faceDetected,
      } : naturalDecision?.sourceDecision || pauseFusionEngine(
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
      if (naturalDecision && (naturalDecision.decision === "wait_longer" || naturalDecision.decision === "keep_listening")) {
        heldVoiceTurnRef.current = { content: outboundContent, ...metrics };
        setDraft(outboundContent);
        setAutoSubmitNotice(localDecision.reason === "visual_preparing_to_continue" || naturalDecision.pauseState === "probably_thinking" ? "I’m waiting while you think..." : "Still with you...");
        scheduleNaturalBoundedWait(metrics.silenceMs, Boolean(outboundContent.trim()));
        window.setTimeout(() => {
          if (voiceMode && !loading && session?.status !== "completed") voice.startListening();
        }, Math.min(1400, Math.max(500, Math.round(localDecision.adjustedWaitMs * 0.22))));
        return;
      }
      if (naturalDecision?.decision === "gentle_prompt") {
        heldVoiceTurnRef.current = { content: outboundContent, ...metrics };
        setDraft(outboundContent);
        naturalGentlePromptShownRef.current = true;
        setAutoSubmitNotice(naturalTimeoutPrompt("soft") || "Still with you...");
        scheduleNaturalBoundedWait(metrics.silenceMs, Boolean(outboundContent.trim()));
        window.setTimeout(() => {
          if (voiceMode && !loading && session?.status !== "completed") voice.startListening();
        }, 1300);
        return;
      }
    }
    clearNaturalTimers();
    heldVoiceTurnRef.current = null;
    naturalGentlePromptShownRef.current = false;
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
          pauseDecision: naturalOptions.decisionOverride || localDecision?.pauseDecision,
          interruptionDetected: naturalConversation.state === "user_interrupting",
          gentlePromptShown: Boolean(naturalOptions.gentlePromptShown),
          forceResolutionTriggered: Boolean(naturalOptions.forceResolutionTriggered),
          hardTimeoutTriggered: Boolean(naturalOptions.hardTimeoutTriggered),
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
      if (fromVoice && voiceMode && naturalModeActive) {
        voice.startListening();
        scheduleNaturalBoundedWait(0, false);
      }
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
    sessionActiveRef.current = true;
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
        scheduleNaturalBoundedWait(0, false);
      })
      .catch(() => {
        naturalConversation.dispatch("error");
        setError("Natural conversation paused. Switch to manual mode?");
      });
  }

  function pauseNaturalConversation() {
    setVoiceMode(false);
    naturalConversation.dispatch("pause");
    clearNaturalTimers();
    voice.stopListening();
    voice.stopSpeaking();
  }

  function resumeNaturalConversation() {
    sessionActiveRef.current = true;
    setError("");
    setVoiceMode(true);
    naturalConversation.dispatch("resume");
    voice.startListening();
    scheduleNaturalBoundedWait(0, Boolean((heldVoiceTurnRef.current?.content || draft).trim()));
  }

  function switchToManualMode() {
    sessionActiveRef.current = true;
    setConversationMode("manual");
    setVoiceMode(false);
    naturalConversation.reset();
    clearNaturalTimers();
    voice.stopListening();
    voice.stopSpeaking();
    cameraSignals.stop();
    stopMediaPipeCamera();
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
    clearNaturalTimers();
    voice.stopListening();
    voice.stopSpeaking();
    cameraSignals.stop();
    stopMediaPipeCamera();
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
          <button type="button" onClick={exitChamber} className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white/76 ring-1 ring-white/12 backdrop-blur-2xl transition hover:bg-white/[0.12]">
            <ArrowLeft size={16} /> Exit chamber
          </button>
          <div className="hidden items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white/76 ring-1 ring-white/12 backdrop-blur-2xl sm:flex">
            <BrainCircuit size={16} /> {session?.practiceType || "Loading"} · elapsed {time}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden max-w-sm xl:block">
              <CameraAssistedTimingToggle enabled={cameraAssistedTiming} onChange={(enabled) => updateCameraAssistance(enabled).catch(() => undefined)} />
            </div>
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
              <CameraTimingStatus enabled={cameraAssistedTiming} state={cameraSignals.state} message={cameraSignals.message} conversationSignal={cameraSignals.conversationSignal} />
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

          {debugTurnTaking && naturalModeActive && (
            <div className="mb-3 rounded-xl bg-black/45 p-3 text-left text-[11px] font-semibold leading-5 text-cyan-50/75 ring-1 ring-cyan-100/15">
              <div className="mb-1 text-cyan-100">Voice debug</div>
              <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                {Object.entries(Object.keys(turnDebug).length ? turnDebug : {
                  micPermission: voice.diagnostics?.micPermission || "unknown",
                  cameraPermission: cameraSignals.state,
                  deepgramConnected: Boolean(voice.diagnostics?.deepgramConnected),
                  audioChunksStreaming: voice.diagnostics?.audioChunksStreaming || 0,
                  transcriptReceived: Boolean(voice.diagnostics?.transcriptReceived),
                  aiResponseReceived: Boolean(voice.diagnostics?.aiResponseReceived),
                  ttsStarted: Boolean(voice.diagnostics?.ttsStarted),
                  ttsError: voice.diagnostics?.ttsError || "",
                  cameraSignalState: cameraSignals.state,
                }).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-3">
                    <span className="text-white/38">{key}</span>
                    <span className="truncate text-right">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <CameraDebugPanel
            visible={debugTurnTaking && naturalModeActive}
            mediaPipeLoaded={cameraSignals.mediaPipeLoaded}
            cameraPermission={cameraSignals.cameraPermission}
            faceSignalState={cameraSignals.faceSignalState}
            conversationSignal={cameraSignals.conversationSignal}
            finalPauseDecision={pauseDecision}
            autoSendTriggered={isFinalizingTurnRef.current}
            blockedReason={!meaningfulTurn(naturalTranscriptRef.current || voice.transcript || "") ? "empty_or_too_short" : latestLoadingRef.current ? "loading" : !latestVoiceModeRef.current ? "voice_mode_off" : ""}
          />

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
              <CameraAssistedTimingToggle enabled={cameraAssistedTiming} onChange={(enabled) => updateCameraAssistance(enabled).catch(() => undefined)} />
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
                onSendNow={() => forceResolveNaturalTurn("send_now")}
                onEnd={finish}
                onSwitchToManual={switchToManualMode}
                countdown={naturalCountdown}
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
