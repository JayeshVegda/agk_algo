import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@akg/core", "@akg/db"],
  serverExternalPackages: ["pino", "pino-pretty", "pg-boss", "postgres"],
};

export default nextConfig;
