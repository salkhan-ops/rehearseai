"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const router = useRouter();
  const { user, profile, loading, isAdmin } = useAuth();
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (loading) return;
    // Read the URL directly rather than useSearchParams() -- that hook requires a
    // Suspense boundary, which most ProtectedRoute call sites don't already have.
    const returnTo = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "";
    if (!user) {
      // Route through signup, not signin: a logged-out visitor landing directly on a
      // protected page (e.g. from a pricing-page CTA) is more often a first-time visitor
      // than a returning one, and the signin form skips consent checkboxes entirely and
      // never passes compliance data to Google sign-in -- so a genuinely new account
      // would get created with ageConfirmed:false and get treated as a returning user by
      // routeAfterLogin (sent to /dashboard instead of the new-signup quick-start flow).
      // The signup form handles returning users fine too -- signInWithGoogleAction
      // detects an existing account via getAdditionalUserInfo(result).isNewUser and skips
      // re-creating/overwriting their profile either way.
      router.replace(`/?auth=signup${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`);
      return;
    }
    // Wait for Firestore profile to load before making the age-check decision —
    // profile===null while it's still being fetched, not a confirmed absence.
    if (!profile) return;
    if (!profile.ageConfirmed) {
      // Preserve where the user was actually headed (e.g. the new-signup quick-start
      // flow) so age-check sends them back there instead of defaulting to /dashboard.
      router.replace(`/age-check${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`);
      return;
    }
    if (adminOnly && !isAdmin) {
      setDenied(true);
    }
  }, [adminOnly, isAdmin, loading, profile, router, user]);

  if (loading || !user || !profile) return <div className="px-4 py-12 text-center font-semibold text-slate-600 dark:text-white/60">Checking access...</div>;
  // Only redirect existing legacy users who never confirmed age; new signups have ageConfirmed:true set during signup.
  if (!profile.ageConfirmed) return <div className="px-4 py-12 text-center font-semibold text-slate-600 dark:text-white/60">Checking age eligibility…</div>;
  if (profile?.status === "disabled" || profile?.status === "removed") {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <div className="rounded-[1.5rem] bg-amber-50 p-6 font-semibold text-amber-800 ring-1 ring-amber-100 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20">
          Your account has been suspended. Contact support if you think this is a mistake.
        </div>
      </div>
    );
  }
  if (adminOnly && !isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <div className="rounded-[1.5rem] bg-rose-50 p-6 font-semibold text-rose-700 ring-1 ring-rose-100">
          {denied ? "Admin access required." : "Checking admin access..."}
        </div>
        {denied && (
          <button onClick={() => router.push("/admin/bootstrap")} className="mt-4 rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">
            Bootstrap first admin
          </button>
        )}
      </div>
    );
  }
  return <>{children}</>;
}
