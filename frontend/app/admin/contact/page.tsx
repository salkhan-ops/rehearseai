"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ContactMessage, ContactMessageStatus, getContactMessages, updateContactMessageStatus } from "@/lib/admin";

const categories = [
  "",
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

const statuses: Array<"" | ContactMessageStatus> = ["", "new", "in_review", "resolved"];

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"" | ContactMessageStatus>("");

  const refresh = () => getContactMessages(category, status).then(setMessages).catch(() => setMessages([]));

  useEffect(() => { refresh(); }, [category, status]);

  async function mark(messageId: string, nextStatus: ContactMessageStatus) {
    await updateContactMessageStatus(messageId, nextStatus);
    refresh();
  }

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Contact Messages</h1>
          <p className="mt-1 font-medium text-slate-500">Support, billing, privacy, technical, and partnership requests.</p>
        </div>
        <div className="flex gap-2">
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-200">
            {categories.map((item) => <option key={item} value={item}>{item || "All categories"}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value as "" | ContactMessageStatus)} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-200">
            {statuses.map((item) => <option key={item} value={item}>{item || "All statuses"}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {messages.map((message) => (
          <div key={message.id || message.messageId} className="rounded-[1.25rem] bg-white p-5 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{message.subject}</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{message.status}</span>
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">{message.category}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500">{message.name} · {message.email} {message.userId ? `· ${message.userId}` : ""}</p>
              </div>
              <p className="text-xs font-semibold text-slate-400">{message.createdAt ? new Date(message.createdAt).toLocaleString() : ""}</p>
            </div>
            <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">{message.message}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => mark(message.id || message.messageId, "in_review")} className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">Mark in review</button>
              <button onClick={() => mark(message.id || message.messageId, "resolved")} className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">Mark resolved</button>
              <button onClick={() => mark(message.id || message.messageId, "new")} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">Reset new</button>
            </div>
          </div>
        ))}
        {!messages.length && <div className="rounded-[1.25rem] bg-white p-8 text-center font-semibold text-slate-500 ring-1 ring-slate-200">No contact messages found.</div>}
      </div>
    </AdminLayout>
  );
}
