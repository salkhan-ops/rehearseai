import type { MetadataRoute } from "next";

const BASE = "https://rehearseai.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  return [
    { url: BASE,                    lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/pricing`,       lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/try`,           lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/blog`,          lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/articles`,      lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/resources`,     lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`,       lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/terms`,         lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/privacy`,       lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/refund-policy`, lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
