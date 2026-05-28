"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import { endSession, generateReport, getSession, sendMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Message, Session } from "@/lib/types";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const { getToken, userId } = useAuth();

  useEffect(() => {
    getToken().then((token) => getSession(id, token)).then((data) => {
        setSession(data.session);
        setMessages(data.messages);
      });
  }, [id, getToken]);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = useMemo(() => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`, [seconds]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const content = String(data.get("message") || "").trim();
    if (!content) return;
    form.reset();
    setLoading(true);
    const token = await getToken();
    const result = await sendMessage(id, content, userId, token);
    setMessages((current) => [...current, result.userMessage, result.aiMessage]);
    setSession((current) => current ? { ...current, turnCount: result.turnCount } : current);
    setLoading(false);
  }

  async function finish() {
    setLoading(true);
    const token = await getToken();
    await endSession(id, token);
    const report = await generateReport(id, token);
    router.push(`/report/${report.id}`);
  }

  return (
    <main className="min-h-screen bg-mist">
      <Nav />
      <section className="mx-auto flex max-w-4xl flex-col px-4 py-6">
        <div className="rounded-[2rem] bg-white p-4 shadow-soft ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
            <div>
              <div className="text-xl font-black">{session?.practiceType || "Loading session"}</div>
              <div className="text-sm text-black/55">Persona rehearsal</div>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold">
              <span className="rounded-full bg-mist px-3 py-2">{session?.difficulty}</span>
              <span className="rounded-full bg-mist px-3 py-2">Turn {session?.turnCount || 0}/8</span>
              <span className="rounded-full bg-mist px-3 py-2">{time}</span>
            </div>
          </div>
          <div className="flex min-h-[52vh] flex-col gap-4 py-5">
            {messages.length === 0 && (
              <div className="rounded-3xl bg-ink p-5 text-white">
                I am ready. Start with your opening response, and I will react like the real person in the room.
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id} className={`max-w-[85%] rounded-3xl p-4 ${message.role === "user" ? "ml-auto bg-iris text-white" : "bg-mist text-ink"}`}>
                <div className="mb-1 text-xs font-black uppercase opacity-60">{message.role === "user" ? "You" : "AI persona"}</div>
                {message.content}
              </div>
            ))}
            {loading && <div className="w-fit rounded-full bg-mist px-4 py-3 text-sm font-bold">Thinking...</div>}
          </div>
          <form onSubmit={onSubmit} className="flex gap-2 border-t border-black/10 pt-4">
            <input name="message" className="min-w-0 flex-1 rounded-full border border-black/10 px-4 py-3" placeholder="Type your response..." />
            <button className="rounded-full bg-ink px-5 py-3 font-bold text-white">Send</button>
          </form>
          <button onClick={finish} disabled={loading} className="mt-3 w-full rounded-full bg-ember px-5 py-3 font-black text-white disabled:opacity-60">End session and generate report</button>
        </div>
      </section>
    </main>
  );
}
