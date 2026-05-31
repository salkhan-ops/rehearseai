"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute adminOnly>{children}</ProtectedRoute>;
}
