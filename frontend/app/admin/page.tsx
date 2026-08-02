"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BookOpen, Box, CreditCard, Database, FileText, Inbox, KeyRound, Layers, ListChecks, ScrollText, ShieldAlert, ShieldCheck, UserCog, Users } from "lucide-react";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getAdminStats, type AdminStats } from "@/lib/admin";

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, activeUsers: 0, activePlans: 0, activeProducts: 0, activeCourseTemplates: 0, activePracticeTemplates: 0, pendingBillingEvents: 0, adminActionsThisWeek: 0 });

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => undefined);
  }, []);

  const authCount = stats.firebaseAuthUserCount;
  const anonymousCount = stats.firebaseAuthAnonymousCount;
  // Only real, identified accounts are compared here -- anonymous guest-trial sessions
  // (see /try) never get an emailed Firestore profile, so including them would falsely
  // read as a wave of failed signups.
  const authMismatch = typeof authCount === "number" && authCount !== stats.totalUsers;

  return (
    <AdminLayout>
      {authMismatch && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Firebase Auth has {authCount!.toLocaleString()} real accounts but Firestore has {stats.totalUsers.toLocaleString()} user profiles — a signup likely partially failed.
            {" "}See <a href="/admin/growth" className="underline underline-offset-2">Growth Dashboard → Marketing Funnel</a> for details.
          </span>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard icon={Users} label="Total Users (Firestore)" value={stats.totalUsers} />
        <AdminStatCard icon={Users} label="Total Users (Firebase Auth)" value={authCount ?? "—"} />
        <AdminStatCard icon={Users} label="Anonymous Guest Sessions" value={anonymousCount ?? "—"} />
        <AdminStatCard icon={Users} label="Active Users" value={stats.activeUsers} />
        <AdminStatCard icon={Layers} label="Active Plans" value={stats.activePlans} />
        <AdminStatCard icon={Box} label="Active Products" value={stats.activeProducts} />
        <AdminStatCard icon={BookOpen} label="Course Templates" value={stats.activeCourseTemplates} />
        <AdminStatCard icon={ListChecks} label="Practice Templates" value={stats.activePracticeTemplates} />
        <AdminStatCard icon={CreditCard} label="Billing Events" value={stats.pendingBillingEvents} />
        <AdminStatCard icon={ScrollText} label="Actions This Week" value={stats.adminActionsThisWeek} />
      </div>
      <AdminSection title="Plans & Subscriptions">
        <AdminCard href="/admin/plans" icon={FileText} title="Manage Plan Templates" subtitle="Create & edit plans with feature flags and limits" badge={stats.totalPlans} />
      </AdminSection>
      <AdminSection title="Catalog">
        <AdminCard href="/admin/products" icon={Box} title="Products & Packages" subtitle="Cards that will later power pricing, courses, and practice pages" />
        <AdminCard href="/admin/course-packages" icon={CreditCard} title="Course Packages" subtitle="One-time purchasable packages shown on the pricing page — price, duration, Paddle ID" />
        <AdminCard href="/admin/practice-templates" icon={ListChecks} title="Practice Templates" subtitle="Reusable scenarios for quick-start practice flows" />
        <AdminCard href="/admin/course-templates" icon={BookOpen} title="Course Templates" subtitle="Fixed-duration courses and training paths" />
      </AdminSection>
      <AdminSection title="User Management">
        <AdminCard href="/admin/assign-plan" icon={UserCog} title="Assign Plan to User" subtitle="Search by UID/email, set entitlements and overrides" />
        <AdminCard href="/admin/users" icon={Users} title="Users List" subtitle="View all users with their current plan assignment" />
        <AdminCard href="/admin/contact" icon={Inbox} title="Contact Messages" subtitle="Review support, billing, privacy, and partnership requests" />
      </AdminSection>
      <AdminSection title="Billing">
        <AdminCard href="/admin/finance" icon={CreditCard} title="Finance Dashboard" subtitle="Estimated MRR, ARR, plan distribution, and revenue by tier" />
        <AdminCard href="/admin/billing" icon={CreditCard} title="Pending Subscriptions" subtitle="Review Paddle checkout attempts, subscription states, and provider mapping" />
        <AdminCard href="/admin/logs" icon={ScrollText} title="Admin Logs" subtitle="Audit create, update, role, and assignment actions" />
      </AdminSection>
      <AdminSection title="Entitlements">
        <AdminCard href="/admin/entitlements" icon={ShieldCheck} title="Global Entitlement Rules" subtitle="Control feature limits used by pricing packages" />
        <AdminCard href="/admin/overrides" icon={KeyRound} title="User Overrides" subtitle="Grant custom access, trials, and manual limits" />
      </AdminSection>
      <AdminSection title="Telemetry">
        <AdminCard href="/admin/telemetry-labels" icon={Database} title="Telemetry Labels" subtitle="Review anonymized turns, add labels, and export training data" />
        <AdminCard href="/admin/safety" icon={ShieldAlert} title="Safety & Scope" subtitle="Review crisis triggers, scope redirects, dependency indicators, and blocked requests" />
      </AdminSection>
    </AdminLayout>
  );
}
