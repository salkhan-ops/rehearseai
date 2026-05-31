"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminLogTable } from "@/components/admin/AdminLogTable";
import { getAdminLogs, type AdminLog } from "@/lib/admin";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  useEffect(() => { getAdminLogs().then(setLogs).catch(() => setLogs([])); }, []);
  return (
    <AdminLayout>
      <AdminHeader title="Admin Logs" subtitle="Audit trail for role changes, plan assignment, products, and templates." />
      <AdminLogTable logs={logs} />
    </AdminLayout>
  );
}
