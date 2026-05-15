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
  return NextResponse.json({
    ok: true,
    next: process.env.NODE_ENV,
    api_base_url_configured: apiConfigured,
    api_reachable: apiOk,
  });
}
