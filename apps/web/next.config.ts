import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@akg/core", "@akg/db"],
  serverExternalPackages: ["pino", "pino-pretty", "pg-boss", "postgres"],
  allowedDevOrigins: ["algo2.zayu.dev", "*.zayu.dev"],
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
