"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { BillingTable } from "@/components/admin/BillingTable";

export default function BillingPage() {
  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Billing</h1>
          <p className="mt-1 font-medium text-slate-500">Paddle checkout attempts, subscriptions, customers, and sync placeholders.</p>
        </div>
        <button className="rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">Manual sync placeholder</button>
      </div>
      <BillingTable />
    </AdminLayout>
  );
}
