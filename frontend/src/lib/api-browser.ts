/**
 * Browser-safe URLs for the Next.js BFF only. Never put FastAPI origins here —
 * the server resolves `API_BASE_URL` in `api-internal.ts` and proxies under `/api/*`.
 */
const BFF_HIREKAAR = "/api/hirekaar";
const BFF_AUTH = "/api/auth";

function join(base: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** e.g. `hirekaarApi("/jobs/me")` → `/api/hirekaar/jobs/me` */
export function hirekaarApi(path: string): string {
  return join(BFF_HIREKAAR, path);
}

/** e.g. `authApi("/login")` → `/api/auth/login` */
export function authApi(path: string): string {
  return join(BFF_AUTH, path);
}
