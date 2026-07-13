"use client";

import Script from "next/script";

// Free, lightweight session-recording/heatmap tool -- lets us watch real sessions
// (particularly Direct traffic, which converts far better than Paid Social) instead of
// guessing at behavior from aggregate funnel numbers alone.
// Create a free project at https://clarity.microsoft.com, then set
// NEXT_PUBLIC_CLARITY_PROJECT_ID in the environment to turn this on.
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

export function Clarity() {
  if (!CLARITY_PROJECT_ID) return null;
  return (
    <Script id="ms-clarity" strategy="afterInteractive">{`
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
    `}</Script>
  );
}
