"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminUser, getUsers, setUserAdmin } from "@/lib/admin";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const refresh = () => getUsers().then(setUsers);
  useEffect(() => { refresh(); }, []);

  return (
    <AdminLayout>
      <h1 className="mb-5 text-3xl font-semibold tracking-[-0.04em]">Users</h1>
      <div className="overflow-hidden rounded-[1.25rem] bg-white shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
        {users.map((user) => (
          <div key={user.uid} className="grid gap-3 border-b border-slate-100 p-4 last:border-0 lg:grid-cols-[1.3fr_1fr_.7fr_.8fr_auto] lg:items-center">
            <div><div className="font-semibold">{user.email || user.uid}</div><div className="text-sm text-slate-500">{user.displayName}</div></div>
            <div className="text-sm font-medium text-slate-500">{user.planName || "Free"} • {user.status || "active"}</div>
            <div className="text-sm font-semibold">{user.role || "user"}</div>
            <Link href="/admin/assign-plan" className="text-sm font-semibold text-[#476bff]">Assign plan</Link>
            <button onClick={async () => { await setUserAdmin(user.uid, user.role !== "admin"); refresh(); }} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold ring-1 ring-slate-200">
              {user.role === "admin" ? "Remove admin" : "Make admin"}
            </button>
          </div>
        ))}
        {!users.length && <div className="p-8 text-center font-semibold text-slate-500">No users found.</div>}
      </div>
    </AdminLayout>
  );
}
