import "server-only";

/**
 * FastAPI origin for Node only (Route Handlers + `api-server`). Set `API_BASE_URL`
 * in repo `.env` / Vercel — not `NEXT_PUBLIC_*`, so the backend URL stays off the client.
 * Browsers call `/api/hirekaar/*` and `/api/auth/*` instead (`api-browser.ts`).
 */
/** Live API: https://hirekaar-backend.vercel.app/ — trailing slash stripped when used. */
export const HIREKAAR_DEFAULT_API_BASE_URL = "https://hirekaar-backend.vercel.app";

function onVercelRuntime(): boolean {
  return (
    process.env.VERCEL === "1" ||
    process.env.VERCEL === "true" ||
    Boolean(process.env.VERCEL_ENV)
  );
}

export function apiInternalBase(): string {
  const fromEnv = process.env.API_BASE_URL?.trim() || process.env.API_INTERNAL_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  // Temporary hardcode: Vercel serverless always targets production API when env omits API_BASE_URL.
  if (onVercelRuntime()) return HIREKAAR_DEFAULT_API_BASE_URL.replace(/\/$/, "");
  return "http://127.0.0.1:8000";
}
