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
  }
};

export default nextConfig;
