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
      // Signin, not signup: the post-login destination no longer depends on which form
      // was used (see routeAfterLogin/signInWithGoogleAction -- it's decided by whether
      // the account is genuinely new, per Firebase's own signal), so there's no reason to
      // force a logged-out visitor through the signup form and its consent checkboxes
      // just because they landed on a protected page. A genuinely new account created
      // here (no compliance collected, since this is the signin form) simply has
      // ageConfirmed:false, which the /age-check branch just below catches on the very
      // next render and collects consent there instead.
      router.replace(`/?auth=signin${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`);
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
