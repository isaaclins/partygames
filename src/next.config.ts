import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === 'true';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: isGithubPages ? '/partygames' : '',
  assetPrefix: isGithubPages ? '/partygames/' : '',
};

export default nextConfig;
