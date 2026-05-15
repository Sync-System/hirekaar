import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth-cookie";

export async function POST() {
  const r = NextResponse.json({ ok: true });
  const opts = authCookieOptions();
  r.cookies.set(AUTH_COOKIE_NAME, "", {
    ...opts,
    maxAge: 0,
  });
  return r;
}
