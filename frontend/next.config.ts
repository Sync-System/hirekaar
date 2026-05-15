import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

import type { NextConfig } from "next";

// `standalone` is for Docker/self-host. Vercel uses the default serverless output.
const isVercel = Boolean(process.env.VERCEL);

// Prefer repo-root `.env` (Docker / local), then `frontend/.env` (overrides).
// On Vercel, skip file-based dotenv so dashboard env vars are never overwritten by
// `frontend/.env` (loadEnv(..., { override: true }) would replace API_BASE_URL).
if (!isVercel) {
  const cwd = process.cwd();
  const rootEnv = resolve(cwd, "..", ".env");
  const localEnv = resolve(cwd, ".env");
  if (existsSync(rootEnv)) {
    loadEnv({ path: rootEnv });
  }
  if (existsSync(localEnv)) {
    loadEnv({ path: localEnv, override: true });
  }
}

const nextConfig: NextConfig = {
  ...(!isVercel ? { output: "standalone" as const } : {}),
  async redirects() {
    return [{ source: "/jobs", destination: "/customer/jobs", permanent: false }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
