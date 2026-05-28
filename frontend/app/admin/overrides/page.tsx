"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { AssignPlanPageContent } from "./shared";

export default function OverridesPage() {
  return (
    <AdminLayout>
      <h1 className="mb-5 text-3xl font-semibold tracking-[-0.04em]">User Overrides</h1>
      <p className="mb-4 font-medium text-slate-500">Grant custom access, trials, and manual limits through the assignment workflow.</p>
      <AssignPlanPageContent />
    </AdminLayout>
  );
}
