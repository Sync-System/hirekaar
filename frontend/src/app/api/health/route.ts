import { NextResponse } from "next/server";

import { apiInternalBase } from "@/lib/api-internal";

/** Liveness: Next is up; optional API reachability (does not require auth). */
export async function GET() {
  let apiOk = false;
  try {
    const r = await fetch(`${apiInternalBase()}/health`, { cache: "no-store" });
    apiOk = r.ok;
  } catch {
    apiOk = false;
  }
  const explicitEnv = Boolean(
    process.env.API_BASE_URL?.trim() || process.env.API_INTERNAL_URL?.trim(),
  );
  const resolvedBase = apiInternalBase();
  const usesVercelBakedDefault =
    process.env.VERCEL === "1" && !explicitEnv && resolvedBase !== "http://127.0.0.1:8000";
  return NextResponse.json({
    ok: true,
    next: process.env.NODE_ENV,
    vercel: Boolean(process.env.VERCEL),
    api_base_url_configured: explicitEnv,
    /** True when using built-in production API URL (no API_BASE_URL set on Vercel). */
    api_base_uses_vercel_baked_default: usesVercelBakedDefault,
    /** Origin used for server-side API proxy (public URL; not a secret). */
    api_base_resolved: resolvedBase,
    /** True when using local FastAPI default (local `npm run dev`). */
    api_base_is_default_localhost: resolvedBase === "http://127.0.0.1:8000",
    api_reachable: apiOk,
  });
}
