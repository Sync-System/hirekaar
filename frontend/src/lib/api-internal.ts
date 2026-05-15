import "server-only";

/**
 * FastAPI origin for Node only (Route Handlers + `api-server`). Set `API_BASE_URL`
 * in repo `.env` / Vercel — not `NEXT_PUBLIC_*`, so the backend URL stays off the client.
 * Browsers call `/api/hirekaar/*` and `/api/auth/*` instead (`api-browser.ts`).
 */
const VERCEL_DEFAULT_API_BASE = "https://hirekaar-backend.vercel.app";

export function apiInternalBase(): string {
  const raw =
    process.env.API_BASE_URL?.trim() ||
    process.env.API_INTERNAL_URL?.trim() ||
    (process.env.VERCEL === "1" ? VERCEL_DEFAULT_API_BASE : "") ||
    "http://127.0.0.1:8000";
  return raw.replace(/\/$/, "");
}
