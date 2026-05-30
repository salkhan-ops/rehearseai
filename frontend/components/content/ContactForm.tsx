"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { submitContact } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const categories = [
  "General question",
  "Billing / Paddle payment",
  "Cancel subscription",
  "Technical issue",
  "Account access",
  "Feature request",
  "Report a bug",
  "Privacy / data request",
  "Partnership / business inquiry",
];

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const { userId } = useAuth();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await submitContact({
        name: String(data.get("name") || ""),
        email: String(data.get("email") || ""),
        category: String(data.get("category") || ""),
        subject: String(data.get("subject") || ""),
        message: String(data.get("message") || ""),
        userId: userId === "guest" ? undefined : userId,
      });
      event.currentTarget.reset();
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] surface-high p-5 md:p-7">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold text-secondary-token">
          Name
          <input name="name" required className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-primary-token outline-none transition focus:border-[var(--accent-primary)]" />
        </label>
        <label className="space-y-2 text-sm font-semibold text-secondary-token">
          Email
          <input name="email" type="email" required className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-primary-token outline-none transition focus:border-[var(--accent-primary)]" />
        </label>
      </div>
      <label className="mt-4 block space-y-2 text-sm font-semibold text-secondary-token">
        Category
        <select name="category" required className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-primary-token outline-none transition focus:border-[var(--accent-primary)]">
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select>
      </label>
      <label className="mt-4 block space-y-2 text-sm font-semibold text-secondary-token">
        Subject
        <input name="subject" required minLength={2} className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-primary-token outline-none transition focus:border-[var(--accent-primary)]" />
      </label>
      <label className="mt-4 block space-y-2 text-sm font-semibold text-secondary-token">
        Message
        <textarea name="message" required rows={7} className="w-full resize-none rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-primary-token outline-none transition focus:border-[var(--accent-primary)]" />
      </label>
      <button disabled={status === "sending"} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6200a8] px-6 py-4 font-semibold text-white shadow-[0_18px_45px_rgba(98,0,168,0.26)] transition hover:-translate-y-0.5 disabled:opacity-60">
        <Send size={18} /> {status === "sending" ? "Sending..." : "Send message"}
      </button>
      {status === "sent" && <p className="mt-4 rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-500">Message received. We will get back to you soon.</p>}
      {status === "error" && <p className="mt-4 rounded-2xl bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-500">{error}</p>}
    </form>
  );
}
