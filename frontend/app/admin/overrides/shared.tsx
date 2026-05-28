"use client";

import { useState } from "react";
import { UserPlanAssignment } from "@/components/admin/UserPlanAssignment";
import { UserSearch } from "@/components/admin/UserSearch";
import type { AdminUser } from "@/lib/admin";

export function AssignPlanPageContent() {
  const [user, setUser] = useState<AdminUser | null>(null);
  return (
    <>
      <UserSearch onFound={setUser} />
      <div className="mt-4">{user && <UserPlanAssignment user={user} />}</div>
    </>
  );
}
