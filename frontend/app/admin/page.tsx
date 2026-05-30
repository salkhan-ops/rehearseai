"use client";

import { useEffect, useState } from "react";
import { CreditCard, FileText, Gem, Inbox, KeyRound, Layers, ShieldCheck, UserCog, Users } from "lucide-react";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getAdminStats, getPlans } from "@/lib/admin";

export default function AdminPage() {
  const [stats, setStats] = useState({ totalPlans: 0, activeUsers: 0, activeSubscribers: 0, pendingSubscriptions: 0 });

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => undefined);
  }, []);

  return (
    <AdminLayout>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard icon={Layers} label="Total Plans" value={stats.totalPlans} />
        <AdminStatCard icon={Users} label="Active Users" value={stats.activeUsers} />
        <AdminStatCard icon={Gem} label="Active Subscribers" value={stats.activeSubscribers} />
        <AdminStatCard icon={CreditCard} label="Pending Subscriptions" value={stats.pendingSubscriptions} />
      </div>
      <AdminSection title="Plans & Subscriptions">
        <AdminCard href="/admin/plans" icon={FileText} title="Manage Plan Templates" subtitle="Create & edit plans with feature flags and limits" badge={stats.totalPlans} />
      </AdminSection>
      <AdminSection title="User Management">
        <AdminCard href="/admin/assign-plan" icon={UserCog} title="Assign Plan to User" subtitle="Search by UID/email, set entitlements and overrides" />
        <AdminCard href="/admin/users" icon={Users} title="Users List" subtitle="View all users with their current plan assignment" />
        <AdminCard href="/admin/contact" icon={Inbox} title="Contact Messages" subtitle="Review support, billing, privacy, and partnership requests" />
      </AdminSection>
      <AdminSection title="Billing">
        <AdminCard href="/admin/billing" icon={CreditCard} title="Pending Subscriptions" subtitle="Review Paddle checkout attempts, subscription states, and provider mapping" />
      </AdminSection>
      <AdminSection title="Entitlements">
        <AdminCard href="/admin/entitlements" icon={ShieldCheck} title="Global Entitlement Rules" subtitle="Control feature limits used by pricing packages" />
        <AdminCard href="/admin/overrides" icon={KeyRound} title="User Overrides" subtitle="Grant custom access, trials, and manual limits" />
      </AdminSection>
    </AdminLayout>
  );
}
