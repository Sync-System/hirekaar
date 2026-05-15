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
  const apiConfigured = Boolean(
    process.env.API_BASE_URL?.trim() || process.env.API_INTERNAL_URL?.trim(),
  );
  const resolvedBase = apiInternalBase();
  const usingDefaultLocalhost =
    !process.env.API_BASE_URL?.trim() && !process.env.API_INTERNAL_URL?.trim();
  return NextResponse.json({
    ok: true,
    next: process.env.NODE_ENV,
    vercel: Boolean(process.env.VERCEL),
    api_base_url_configured: apiConfigured,
    /** Origin used for server-side API proxy (public URL; not a secret). */
    api_base_resolved: resolvedBase,
    /** True when falling back to http://127.0.0.1:8000 — set API_BASE_URL on this Vercel project. */
    api_base_is_default_localhost: usingDefaultLocalhost,
    api_reachable: apiOk,
  });
}
