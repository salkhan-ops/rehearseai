"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { once, track } from "@/lib/analytics";

const SCROLL_THRESHOLDS = [25, 50, 75, 100] as const;
const TIME_THRESHOLDS_SECONDS = [10, 30, 60, 120] as const;

// Site-wide scroll-depth and time-on-page signal, so funnel review isn't limited to two
// endpoints (landed vs. converted) -- lets us tell whether people who scroll further or
// stay longer actually convert better, versus this being a pure traffic-quality problem.
export function EngagementTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let ticking = false;
    function checkScrollDepth() {
      ticking = false;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const percent = scrollable <= 0 ? 100 : Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      for (const threshold of SCROLL_THRESHOLDS) {
        if (percent >= threshold) {
          once(`scroll_depth_${pathname}_${threshold}`, () => track.scrollDepth(threshold));
        }
      }
    }
    function handleScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(checkScrollDepth);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    checkScrollDepth();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  useEffect(() => {
    const timers = TIME_THRESHOLDS_SECONDS.map((seconds) =>
      setTimeout(() => {
        if (document.visibilityState === "visible") {
          once(`time_on_page_${pathname}_${seconds}`, () => track.timeOnPage(seconds));
        }
      }, seconds * 1000),
    );
    return () => timers.forEach(clearTimeout);
  }, [pathname]);

  return null;
}
