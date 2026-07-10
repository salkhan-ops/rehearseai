"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import { AnimatedPage, StaggeredGrid } from "@/components/animations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CourseEnrollmentModal } from "@/components/courses/CourseEnrollmentModal";
import { CourseTemplateCard } from "@/components/courses/CourseTemplateCard";
import { Nav } from "@/components/Nav";
import { getCoursePackages, type CoursePackage } from "@/lib/admin";
import { getCoursePackageAccess } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { CourseTemplate, Difficulty } from "@/lib/types";

const packageSkills: Record<string, string[]> = {
  "Job Interview": ["Answer structure", "Evidence", "Follow-up recovery", "Composure"],
  "Salary Negotiation": ["Anchoring", "Counter-offers", "Silence tolerance", "Closing"],
  "Presentation / Public Speaking": ["Structure", "Audience control", "Q&A", "Recovery"],
  "Sales Pitch": ["Value framing", "Objections", "Urgency", "Closing"],
  "Difficult Conversation": ["Directness", "Empathy", "Boundaries", "Repair"],
  "Panel Discussion": ["Brevity", "Interruptions", "Evidence", "Composure"],
  "Thesis Defense": ["Methods", "Assumptions", "Limitations", "Defense"],
  "Teaching Session": ["Clarity", "Examples", "Questions", "Adaptation"],
};

const packageCategories: Record<string, string> = {
  "Job Interview": "Interview",
  "Salary Negotiation": "Negotiation",
  "Presentation / Public Speaking": "Public Speaking",
  "Sales Pitch": "Sales",
  "Difficult Conversation": "Difficult Conversations",
  "Panel Discussion": "Panel Discussion",
  "Thesis Defense": "Thesis Defense",
  "Teaching Session": "Teaching",
  "Casual Chat": "Casual Chat",
  "Podcast / Interview Show": "Podcast",
};

function packageTemplate(pkg: CoursePackage): CourseTemplate {
  return {
    id: `package:${pkg.packageId}`,
    title: pkg.title,
    category: packageCategories[pkg.practiceType] ?? "Interview",
    durationDays: pkg.durationDays,
    frequency: "daily",
    difficulty: (pkg.stakeLevel === "high" ? "Advanced" : "Intermediate") as Difficulty,
    dailyMinutes: "20",
    targetSkills: packageSkills[pkg.practiceType] ?? ["Clarity", "Composure", "Evidence", "Recovery"],
    description: pkg.description,
    whoFor: `People preparing for a focused ${pkg.practiceType.toLowerCase()} goal.`,
    expectedTransformation: `${pkg.sessionsIncluded} structured sessions with escalating, relevant practice.`,
    isActive: pkg.isActive,
    sortOrder: pkg.sortOrder,
  };
}

export default function CourseTemplatesPage() {
  const { getToken } = useAuth();
  const [packages, setPackages] = useState<CoursePackage[]>([]);
  const [activePackageIds, setActivePackageIds] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [duration, setDuration] = useState<number | "all">("all");
  const [enrolling, setEnrolling] = useState<{ template: CourseTemplate; coursePackage: CoursePackage } | null>(null);
  const [checkoutJustCompleted, setCheckoutJustCompleted] = useState(false);
  const handledCheckoutReturn = useRef(false);

  const refreshPackageAccess = useCallback(async () => {
    try {
      const token = await getToken();
      const access = await getCoursePackageAccess(token);
      setActivePackageIds(access.activePackageIds);
      setIsAdmin(access.isAdmin);
      return access.activePackageIds;
    } catch {
      setActivePackageIds([]);
      setIsAdmin(false);
      return [];
    }
  }, [getToken]);

  useEffect(() => {
    getCoursePackages().then(setPackages).catch(() => setPackages([]));
    refreshPackageAccess();
  }, [refreshPackageAccess]);

  useEffect(() => {
    function onPaymentComplete() {
      window.setTimeout(() => refreshPackageAccess(), 2500);
      window.setTimeout(() => refreshPackageAccess(), 8000);
    }
    window.addEventListener("paddle:payment-complete", onPaymentComplete);
    return () => window.removeEventListener("paddle:payment-complete", onPaymentComplete);
  }, [refreshPackageAccess]);

  useEffect(() => {
    if (!packages.length || handledCheckoutReturn.current) return;
    const params = new URLSearchParams(window.location.search);
    const packageId = params.get("package");
    if (!packageId) return;
    const pkg = packages.find((item) => item.packageId === packageId);
    if (!pkg) return;
    handledCheckoutReturn.current = true;
    const paymentComplete = params.get("payment") === "complete";
    setCheckoutJustCompleted(paymentComplete);
    setEnrolling({ template: packageTemplate(pkg), coursePackage: pkg });
    if (paymentComplete) {
      (async () => {
        for (let attempt = 0; attempt < 6; attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, attempt === 0 ? 1200 : 2500));
          const activeIds = await refreshPackageAccess();
          if (activeIds.includes(packageId)) return;
        }
      })();
    }
  }, [packages, refreshPackageAccess]);

  const visible = useMemo(
    () => packages.filter((pkg) => pkg.isActive && (duration === "all" || pkg.durationDays === duration)),
    [duration, packages],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950 dark:bg-[#07111f] dark:text-white">
      <Nav />
      <ProtectedRoute>
        <AnimatedPage className="relative mx-auto max-w-7xl px-4 py-14">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700 dark:text-cyan-100/60">One-time course packages</p>
              <h1 className="mt-4 text-5xl font-semibold leading-[0.94] tracking-[-0.06em] md:text-7xl">Choose, pay, then train.</h1>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600 dark:text-white/58">
                Every 7, 14, or 21-day course is purchased separately. Pro and Coach subscriptions do not include these course packages.
              </p>
            </div>
            <Link href="/pricing#subscriptions" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-800 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/15">
              <CreditCard size={17} /> Compare subscriptions
            </Link>
          </div>

          <div className="mt-7 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20">
            <ShieldCheck size={18} /> Payment is verified before a course calendar or session can be created.
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {(["all", 7, 14, 21] as const).map((item) => (
              <button key={item} type="button" onClick={() => setDuration(item)} className={`rounded-full px-4 py-2 text-sm font-bold ${duration === item ? "bg-[#6200a8] text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/70 dark:ring-white/10"}`}>
                {item === "all" ? "All courses" : `${item} days`}
              </button>
            ))}
          </div>

          <StaggeredGrid className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((pkg) => {
              const template = packageTemplate(pkg);
              return (
                <CourseTemplateCard
                  key={pkg.packageId}
                  template={template}
                  coursePackage={pkg}
                  hasAccess={isAdmin || activePackageIds.includes(pkg.packageId)}
                  onStart={() => {
                    setCheckoutJustCompleted(false);
                    setEnrolling({ template, coursePackage: pkg });
                  }}
                />
              );
            })}
          </StaggeredGrid>
        </AnimatedPage>
      </ProtectedRoute>
      <CourseEnrollmentModal
        template={enrolling?.template ?? null}
        coursePackage={enrolling?.coursePackage}
        hasAccess={Boolean(enrolling && (isAdmin || activePackageIds.includes(enrolling.coursePackage.packageId)))}
        checkoutJustCompleted={checkoutJustCompleted}
        onClose={() => {
          setEnrolling(null);
          setCheckoutJustCompleted(false);
        }}
      />
    </main>
  );
}
