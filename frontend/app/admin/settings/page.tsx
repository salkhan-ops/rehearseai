"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <AdminHeader title="Admin Settings" subtitle="Operational placeholders for Firebase, Paddle, Gemini, and product visibility controls." />
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["Firebase Auth", "Admin access is controlled by users/{uid}.role == admin. Backend strict token verification is marked TODO before production."],
          ["Paddle", "Paddle product IDs, price IDs, subscriptions, checkout attempts, and webhook events are represented as placeholders."],
          ["Catalog Source", "Public pages will later read products, plans, course templates, and practice templates from admin-created catalog data."],
          ["Feature Constraints", "Plan entitlements control session limits, reports, voice, brutal mode, beginner hints, conversation maps, and course templates."],
        ].map(([title, body]) => (
          <section key={title} className="rounded-[1.25rem] bg-white p-5 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">{title}</h2>
            <p className="mt-2 font-medium leading-7 text-slate-500">{body}</p>
          </section>
        ))}
      </div>
    </AdminLayout>
  );
}
