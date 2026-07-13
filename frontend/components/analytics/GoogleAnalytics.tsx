"use client";

import Script from "next/script";
import { flushAnalyticsQueue, LANDING_VIEWED_KEY, SESSION_ID_KEY, UTM_KEY } from "@/lib/analytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function GoogleAnalytics() {
  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script
        id="ga-init"
        strategy="afterInteractive"
        onReady={() => {
          flushAnalyticsQueue();
        }}
      >{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', '${GA_ID}', { page_path: window.location.pathname });

        // Fires landing_page_viewed (and captures first-touch UTM params) as soon as this
        // script runs, rather than waiting for the homepage's React tree to hydrate. That
        // tree renders a lot of concurrently-animated elements above the fold; on slow or
        // constrained connections (in-app browsers from paid social ads are the usual
        // culprit) hydration can lag well behind this script, and plenty of visitors bounce
        // in that gap. Previously the equivalent event only fired from a React useEffect in
        // MetaPixel.tsx, so those sessions were silently missing from the funnel even though
        // GA's own automatic pageview (this same script) counted them -- see track.landingPageViewed
        // in lib/analytics.ts for the corresponding client-side dedupe.
        (function () {
          try {
            if (window.location.pathname !== "/") return;
            var sessionId = sessionStorage.getItem("${SESSION_ID_KEY}");
            if (!sessionId) {
              sessionId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + "-" + Math.random().toString(36).slice(2));
              sessionStorage.setItem("${SESSION_ID_KEY}", sessionId);
            }
            if (!sessionStorage.getItem("${UTM_KEY}")) {
              var params = new URLSearchParams(window.location.search);
              var utm = {};
              ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (key) {
                var value = params.get(key);
                if (value) utm[key] = value;
              });
              if (Object.keys(utm).length > 0) sessionStorage.setItem("${UTM_KEY}", JSON.stringify(utm));
            }
            if (sessionStorage.getItem("${LANDING_VIEWED_KEY}")) return;
            sessionStorage.setItem("${LANDING_VIEWED_KEY}", "1");
            gtag('event', 'landing_page_viewed', { source_page: document.referrer || "", session_id: sessionId, user_status: 'anonymous' });
          } catch (e) {}
        })();
      `}</Script>
    </>
  );
}
