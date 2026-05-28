"use client";

import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { AdminUser, findUser } from "@/lib/admin";

export function UserSearch({ onFound }: { onFound: (user: AdminUser) => void }) {
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const term = String(new FormData(event.currentTarget).get("term"));
    const user = await findUser(term);
    if (user) onFound(user);
    else setError("No user found.");
  }
  return (
    <form onSubmit={submit} className="rounded-[1.25rem] bg-white p-4 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      <div className="flex gap-2">
        <input name="term" placeholder="Search by UID or email" className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-medium outline-none" />
        <button className="inline-flex items-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white"><Search size={17} /> Search</button>
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}
    </form>
  );
}
