/** Server-only base URL for FastAPI (no trailing slash). */
export function apiInternalBase(): string {
  const raw =
    process.env.API_BASE_URL?.trim() ||
    process.env.API_INTERNAL_URL?.trim() ||
    "http://127.0.0.1:8000";
  return raw.replace(/\/$/, "");
}
