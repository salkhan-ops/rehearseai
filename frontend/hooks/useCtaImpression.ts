"use client";

import { useEffect, useRef } from "react";
import { once, track } from "@/lib/analytics";

// Fires cta_impression the first time the element is actually visible in the viewport,
// separate from cta_clicked -- lets us compute a true click-through-when-seen rate instead
// of a click-through-on-page-load rate, which understates CTR for anyone who has to scroll
// to reach the button.
export function useCtaImpression<T extends HTMLElement>(label: string) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            once(`cta_impression_${label}`, () => track.ctaImpression(label));
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [label]);

  return ref;
}
