"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { flushMetaPixelQueue, META_PIXEL_ID, pageview } from "@/lib/metaPixel";

export function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const query = searchParams.toString();

  useEffect(() => {
    if (!ready) return;
    pageview(`${pathname}${query ? `?${query}` : ""}`);
  }, [pathname, query, ready]);

  return (
    <Script id="meta-pixel" strategy="afterInteractive" onReady={() => { flushMetaPixelQueue(); setReady(true); }}>
      {`
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
        (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${META_PIXEL_ID}');
      `}
    </Script>
  );
}
