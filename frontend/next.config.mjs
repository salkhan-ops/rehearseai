/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "";
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const basePath = configuredBasePath || (isGitHubPages && repositoryName ? `/${repositoryName}` : "");

const nextConfig = {
  output: isGitHubPages ? "export" : "standalone",
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: isGitHubPages
  },
  trailingSlash: isGitHubPages
};

export default nextConfig;
