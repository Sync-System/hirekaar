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

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: true, api_reachable: apiOk });
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
    api_base_uses_vercel_baked_default: usesVercelBakedDefault,
    api_base_resolved: resolvedBase,
    api_base_is_default_localhost: resolvedBase === "http://127.0.0.1:8000",
    api_reachable: apiOk,
  });
}
