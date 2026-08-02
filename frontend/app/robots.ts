import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Everything wrapped in <ProtectedRoute> client-side redirects an unauthenticated
      // visitor (including Googlebot) to /?auth=signin -- crawling these produced the
      // "Page with redirect" and "Duplicate without user-selected canonical" Search
      // Console errors on /practice/setup and /?auth=signin.
      disallow: [
        "/admin", "/dashboard", "/session", "/settings", "/practice", "/api",
        "/courses", "/history", "/notifications", "/progress", "/subscription",
        "/voice-calibration", "/age-check",
      ],
    },
    sitemap: "https://rehearseai.dev/sitemap.xml",
  };
}
