"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminSearchBar } from "@/components/admin/AdminSearchBar";
import { AssignPlanModal } from "@/components/admin/AssignPlanModal";
import { UserDetailPanel } from "@/components/admin/UserDetailPanel";
import { AdminUser, getPlans, getUsers, Plan, setUserAdmin } from "@/lib/admin";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [assigning, setAssigning] = useState<AdminUser | null>(null);
  const refresh = () => getUsers().then(setUsers);
  useEffect(() => { refresh(); getPlans().then(setPlans); }, []);
  const filtered = users.filter((user) => {
    const haystack = `${user.uid} ${user.email || ""} ${user.displayName || ""}`.toLowerCase();
    return (!search || haystack.includes(search.toLowerCase())) && (!role || (user.role || "user") === role) && (!plan || (user.planId || "free") === plan) && (!status || (user.status || "active") === status);
  });

  return (
    <AdminLayout>
      <AdminHeader title="Users" subtitle="Search, filter, inspect, change roles, and assign plans." />
      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
        <AdminSearchBar value={search} onChange={setSearch} placeholder="Search email, UID, or display name" />
        <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-2xl bg-white px-4 py-3 font-semibold ring-1 ring-slate-200"><option value="">All roles</option><option value="user">user</option><option value="admin">admin</option></select>
        <select value={plan} onChange={(event) => setPlan(event.target.value)} className="rounded-2xl bg-white px-4 py-3 font-semibold ring-1 ring-slate-200"><option value="">All plans</option>{plans.map((item) => <option key={item.planId} value={item.planId}>{item.name}</option>)}</select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl bg-white px-4 py-3 font-semibold ring-1 ring-slate-200"><option value="">All status</option>{["active", "trialing", "past_due", "cancelled", "disabled"].map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="overflow-hidden rounded-[1.25rem] bg-white shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
          {filtered.map((user) => (
            <div key={user.uid} onClick={() => setSelected(user)} className="grid w-full cursor-pointer gap-3 border-b border-slate-100 p-4 text-left last:border-0 lg:grid-cols-[1.3fr_1fr_.7fr_.9fr_auto] lg:items-center">
              <div><div className="font-semibold">{user.email || user.uid}</div><div className="text-sm text-slate-500">{user.displayName || user.uid}</div></div>
              <div className="text-sm font-medium text-slate-500">{user.planName || "Free"} • {user.status || "active"}</div>
              <div className="text-sm font-semibold">{user.role || "user"}</div>
              <Link href="/admin/assign-plan" onClick={(event) => event.stopPropagation()} className="text-sm font-semibold text-[#476bff]">Legacy assign</Link>
              <span className="flex gap-2">
                <button onClick={async (event) => { event.stopPropagation(); setAssigning(user); }} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold ring-1 ring-slate-200">Assign</button>
                <button onClick={async (event) => { event.stopPropagation(); await setUserAdmin(user.uid, user.role !== "admin"); refresh(); }} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold ring-1 ring-slate-200">
                  {user.role === "admin" ? "Remove admin" : "Make admin"}
                </button>
              </span>
            </div>
          ))}
          {!filtered.length && <div className="p-8 text-center font-semibold text-slate-500">No users found.</div>}
        </div>
        <UserDetailPanel user={selected || filtered[0] || null} />
      </div>
      <AssignPlanModal user={assigning} plans={plans} onClose={() => setAssigning(null)} onAssigned={refresh} />
    </AdminLayout>
  );
}
