"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Mic, MicOff, Send, Square, Volume2 } from "lucide-react";
import { AnimatedMessage, AnimatedPage, TypingIndicator } from "@/components/animations";
import { Nav } from "@/components/Nav";
import { ScenarioAvatar } from "@/components/ScenarioAvatar";
import { endSession, generateReport, getSession, sendMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useContinuousVoice } from "@/hooks/useContinuousVoice";
import type { Message, Session } from "@/lib/types";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [voiceMode, setVoiceMode] = useState(false);
  const { getToken, userId } = useAuth();
  const voice = useContinuousVoice();

  useEffect(() => {
    getToken().then((token: string | null) => getSession(id, token)).then((data: { session: Session; messages: Message[] }) => {
        setSession(data.session);
        setMessages(data.messages);
      });
  }, [id, getToken]);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = useMemo(() => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`, [seconds]);

  useEffect(() => {
    if (voice.transcript || voice.interimTranscript) {
      setDraft(`${voice.transcript} ${voice.interimTranscript}`.trim());
    }
  }, [voice.transcript, voice.interimTranscript]);

  useEffect(() => {
    return voice.onFinalTranscript((nextTranscript) => {
      if (!voiceMode || loading) return;
      submitContent(nextTranscript, true);
    });
  }, [voice.onFinalTranscript, voiceMode, loading]);

  useEffect(() => {
    if (!voiceMode || loading || voice.isSpeaking) return;
    if (voice.supported && voice.voiceState === "idle") voice.startListening();
    return () => {
      if (!voiceMode) voice.stopListening();
    };
  }, [voiceMode, loading, voice.isSpeaking, voice.supported, voice.voiceState, voice.startListening, voice.stopListening]);

  async function submitContent(content: string, fromVoice = false) {
    if (!content.trim()) return;
    setDraft("");
    voice.resetTranscript();
    setLoading(true);
    const token = await getToken();
    const result = await sendMessage(id, content.trim(), userId, token);
    setMessages((current) => [...current, result.userMessage, result.aiMessage]);
    setSession((current) => current ? { ...current, turnCount: result.turnCount } : current);
    await voice.speak(result.aiMessage.content);
    setLoading(false);
    if (fromVoice && voiceMode) {
      voice.startListening();
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitContent(draft);
  }

  async function finish() {
    voice.stopListening();
    voice.stopSpeaking();
    setLoading(true);
    const token = await getToken();
    await endSession(id, token);
    const report = await generateReport(id, token);
    router.push(`/report/${report.id}`);
  }

  return (
    <main className="mesh-bg min-h-screen">
      <Nav />
      <AnimatedPage className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="space-y-4">
          <ScenarioAvatar practiceType={session?.practiceType} speaking={loading || voice.isSpeaking || voice.isListening} />
          <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_18px_55px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6200a8] dark:text-violet-200">Voice mode</div>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => {
                  if (voiceMode) {
                    setVoiceMode(false);
                    voice.stopListening();
                    voice.stopSpeaking();
                  } else {
                    setVoiceMode(true);
                    voice.startListening();
                  }
                }}
                disabled={!voice.supported}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:opacity-45 ${voiceMode ? "bg-[#6200a8] text-white shadow-[0_14px_30px_rgba(98,0,168,0.18)]" : "bg-slate-50 text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/70 dark:ring-white/10"}`}
              >
                {voiceMode ? <MicOff size={18} /> : <Mic size={18} />}
                {voiceMode ? "Stop live conversation" : "Start live conversation"}
              </button>
              {voice.isSpeaking && (
                <button
                  type="button"
                  onClick={() => {
                    voice.stopSpeaking();
                    if (voiceMode) voice.startListening();
                  }}
                  className="inline-flex items-center justify-center rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 ring-1 ring-rose-100 transition hover:bg-rose-100 dark:bg-rose-400/10 dark:text-rose-100 dark:ring-rose-300/20"
                >
                  Interrupt and respond
                </button>
              )}
            </div>
            <div className="mt-4 flex justify-center">
              <div className={`h-24 w-24 rounded-full bg-gradient-to-br from-violet-500 to-sky-400 shadow-[0_0_55px_rgba(98,0,168,0.28)] transition ${voice.isListening ? "animate-pulse scale-105" : voice.isSpeaking ? "scale-100 opacity-90" : "scale-95 opacity-55"}`} />
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/60 dark:ring-white/10">
              <Volume2 size={17} />
              {loading || voice.isProcessing ? "Thinking..." : voice.isSpeaking ? "AI responding..." : voice.voiceState === "user_speaking" ? "Listening..." : voice.voiceState === "silence_detected" ? "Pause detected. Finalizing..." : voiceMode ? "Listening for your next answer..." : "Hands-free mode listens, sends, and replies aloud."}
            </div>
            {!voice.supported && <p className="mt-3 text-sm font-medium text-slate-600 dark:text-white/60">Speech recognition works best in Chrome or Edge. Text input is available below.</p>}
            {(voice.transcript || voice.interimTranscript) && (
              <div className="mt-3 rounded-2xl bg-white/70 p-3 text-sm font-medium text-slate-600 dark:bg-white/10 dark:text-white/65">
                <p>{voice.transcript}</p>
                {voice.interimTranscript && <p className="text-slate-400 dark:text-white/40">{voice.interimTranscript}</p>}
              </div>
            )}
            <div className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-white/35">State: {voice.voiceState}</div>
          </div>
        </aside>

        <div className="rounded-[1.75rem] bg-white/90 p-4 shadow-[0_18px_55px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75 backdrop-blur dark:bg-white/10 dark:ring-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-white/10">
            <div>
              <div className="text-xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">{session?.practiceType || "Loading session"}</div>
              <div className="text-sm font-medium text-slate-500 dark:text-white/55">Structured persona rehearsal</div>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="rounded-full bg-[#6200a8] px-3 py-2 text-white">{session?.difficulty}</span>
              <span className="rounded-full bg-white px-3 py-2 text-slate-600 ring-1 ring-violet-100 dark:bg-white/10 dark:text-white/70 dark:ring-white/10">Turn {session?.turnCount || 0}/8</span>
              <span className="rounded-full bg-white px-3 py-2 text-slate-600 ring-1 ring-violet-100 dark:bg-white/10 dark:text-white/70 dark:ring-white/10">{time}</span>
            </div>
          </div>
          <div className="flex min-h-[52vh] flex-col gap-4 py-5">
            {messages.length === 0 && (
              <div className="rounded-[1.5rem] bg-[#6200a8] p-5 font-medium text-white shadow-[0_14px_30px_rgba(98,0,168,0.16)]">
                I am ready. Start with your opening response, and I will react like the real person in the room.
              </div>
            )}
            {messages.map((message) => (
              <AnimatedMessage key={message.id} className={`max-w-[85%] rounded-3xl p-4 font-medium leading-7 ${message.role === "user" ? "ml-auto bg-gradient-to-br from-violet-600 to-sky-500 text-white" : "bg-violet-50 text-slate-800 dark:bg-white/10 dark:text-white/82"}`}>
                <div className="mb-1 text-xs font-semibold uppercase opacity-60">{message.role === "user" ? "You" : "AI persona"}</div>
                {message.content}
              </AnimatedMessage>
            ))}
            {loading && <TypingIndicator />}
          </div>
          <form onSubmit={onSubmit} className="flex gap-2 border-t border-violet-100 pt-4 dark:border-white/10">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={2}
              className="min-w-0 flex-1 resize-none rounded-3xl border border-violet-100 bg-white/90 px-4 py-3 font-medium text-slate-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-200/50 dark:border-white/10 dark:bg-white/10 dark:text-white"
              placeholder="Fallback text response..."
            />
            <button className="inline-flex items-center justify-center rounded-3xl bg-[#6200a8] px-5 py-3 font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.18)] transition hover:-translate-y-0.5">
              <Send size={18} />
            </button>
          </form>
          <AnimatedMessage className="mt-3">
            <button onClick={finish} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 font-semibold text-white shadow-[0_14px_30px_rgba(244,63,94,0.18)] transition hover:-translate-y-0.5 disabled:opacity-60">
            <Square size={16} /> End session and generate report
            </button>
          </AnimatedMessage>
        </div>
      </AnimatedPage>
    </main>
  );
}
