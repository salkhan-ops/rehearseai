import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const basePath = configuredBasePath;
const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  output: "standalone",
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: false
  },
  turbopack: {
    root: frontendRoot
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // Allow Google Sign-in popup to communicate back to the parent window.
            // "same-origin" (Next.js default) blocks cross-origin popups like Google Auth.
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
