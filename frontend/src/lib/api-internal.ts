/** Default FastAPI origin when the Next app is on Vercel and `API_BASE_URL` is unset. */
const VERCEL_DEFAULT_API_BASE = "https://hirekaar-backend.vercel.app";

/** Server-only base URL for FastAPI (no trailing slash). */
export function apiInternalBase(): string {
  const raw =
    process.env.API_BASE_URL?.trim() ||
    process.env.API_INTERNAL_URL?.trim() ||
    (process.env.VERCEL === "1" ? VERCEL_DEFAULT_API_BASE : "") ||
    "http://127.0.0.1:8000";
  return raw.replace(/\/$/, "");
}
