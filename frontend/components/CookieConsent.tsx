"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "rehearseai_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!window.localStorage.getItem(CONSENT_KEY));
  }, []);

  function save(choice: "essential" | "all") {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice, savedAt: new Date().toISOString() }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-[1.5rem] surface-high p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-primary-token">Cookie preferences</p>
          <p className="mt-1 text-sm font-medium leading-6 text-secondary-token">
            We use essential cookies/local storage for authentication and preferences. Analytics and performance cookies are placeholders for future product improvement.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => save("essential")} className="rounded-2xl surface-low px-4 py-3 text-sm font-semibold text-secondary-token ring-1 ring-[var(--border-soft)]">Essential only</button>
          <button onClick={() => save("all")} className="rounded-2xl bg-[#6200a8] px-4 py-3 text-sm font-semibold text-white">Accept all</button>
        </div>
      </div>
    </div>
  );
}
