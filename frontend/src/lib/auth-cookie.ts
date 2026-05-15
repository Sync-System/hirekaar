/** Session cookie written by `/api/auth/login` and `/api/auth/register`. */
export const AUTH_COOKIE_NAME = "hk_token";

export function authCookieSecure(): boolean {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

/** Options shared by set + clear so browsers reliably drop the cookie. */
export function authCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  path: string;
  secure: boolean;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: authCookieSecure(),
  };
}

/** Align with backend `ACCESS_TOKEN_EXPIRE_MINUTES` default (7 days). */
export const AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;
