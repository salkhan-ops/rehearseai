"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { UserPlanAssignment } from "@/components/admin/UserPlanAssignment";
import { UserSearch } from "@/components/admin/UserSearch";
import type { AdminUser } from "@/lib/admin";

export default function AssignPlanPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  return (
    <AdminLayout>
      <h1 className="mb-5 text-3xl font-semibold tracking-[-0.04em]">Assign Plan to User</h1>
      <UserSearch onFound={setUser} />
      <div className="mt-4">{user && <UserPlanAssignment user={user} />}</div>
    </AdminLayout>
  );
}
