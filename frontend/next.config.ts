import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

import type { NextConfig } from "next";

// Prefer repo-root `.env` (full-stack Docker / local), then `frontend/.env` (overrides).
const cwd = process.cwd();
const rootEnv = resolve(cwd, "..", ".env");
const localEnv = resolve(cwd, ".env");
if (existsSync(rootEnv)) {
  loadEnv({ path: rootEnv });
}
if (existsSync(localEnv)) {
  loadEnv({ path: localEnv, override: true });
}

// `standalone` is for Docker/self-host. Vercel uses the default serverless output.
const isVercel = Boolean(process.env.VERCEL);

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
