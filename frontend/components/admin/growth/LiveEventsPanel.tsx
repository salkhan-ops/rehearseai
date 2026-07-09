"use client";

import { AlertTriangle } from "lucide-react";
import type { LiveEventCounts } from "@/lib/growth/services/liveEventsService";

const LABELS: Record<string, string> = {
  landing_page_viewed: "Landing page viewed",
  hero_cta_clicked: "Hero CTA clicked",
  signup_started: "Signup started",
  signup_completed: "Signup completed",
  login_completed: "Login completed",
  interview_room_entered: "Interview room entered",
  interview_started: "Interview started",
  interview_completed: "Interview completed",
  feedback_viewed: "Feedback viewed",
  checkout_initiated: "Checkout initiated",
  purchase_completed: "Purchase completed",
};

export function LiveEventsPanel({ events, authUserCount, firestoreUserCount }: {
  events: LiveEventCounts;
  authUserCount?: number | null;
  firestoreUserCount?: number;
}) {
  const mismatch = typeof authUserCount === "number" && typeof firestoreUserCount === "number" && authUserCount !== firestoreUserCount;

  return (
    <div className="rounded-[1.25rem] bg-white p-5 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-[-0.03em]">Live funnel events</h2>
        <p className="mt-0.5 text-sm font-medium text-slate-500">
          Real counts logged as each event fires — CTA clicks, signup/login, and checkout steps that the Firestore user/session collections don&apos;t capture on their own.
        </p>
      </div>

      {mismatch && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Firebase Auth has {authUserCount!.toLocaleString()} accounts but Firestore has {firestoreUserCount!.toLocaleString()} user profiles.
            {" "}A mismatch usually means a signup partially failed (Auth account created without a Firestore profile, or vice versa).
          </span>
        </div>
      )}

      {!events.hasData && (
        <div className="mb-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
          No events logged yet — this fills in automatically as visitors browse, sign up, and check out.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
              <th className="pb-2 pr-4">Event</th>
              <th className="pb-2 pr-4 text-right">Today</th>
              <th className="pb-2 pr-4 text-right">Last 7 days</th>
              <th className="pb-2 text-right">Last 30 days</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(events.counts).map(([name, counts]) => (
              <tr key={name} className="border-t border-slate-100">
                <td className="py-2 pr-4 font-semibold text-slate-800">{LABELS[name] || name}</td>
                <td className="py-2 pr-4 text-right font-semibold text-slate-700">{counts.today.toLocaleString()}</td>
                <td className="py-2 pr-4 text-right font-semibold text-slate-700">{counts.last7d.toLocaleString()}</td>
                <td className="py-2 text-right font-semibold text-slate-700">{counts.last30d.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
