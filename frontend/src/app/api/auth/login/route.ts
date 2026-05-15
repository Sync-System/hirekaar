import { NextResponse } from "next/server";

import { apiInternalBase } from "@/lib/api-internal";
import { AUTH_COOKIE_MAX_AGE_SEC, AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth-cookie";

export async function POST(request: Request) {
  const base = apiInternalBase();
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
    }

    let res: Response;
    try {
      res = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error("[api/auth/login] upstream fetch failed:", base, err);
      return NextResponse.json(
        {
          detail:
            "Cannot reach the API backend. Set API_BASE_URL on Vercel to your FastAPI HTTPS origin, then redeploy.",
        },
        { status: 503 },
      );
    }

    const raw = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      data = { detail: raw.slice(0, 500) || `Upstream returned status ${res.status}` };
    }

    if (!res.ok) {
      console.error("[api/auth/login] upstream error", res.status, base, data);
      return NextResponse.json(data, { status: res.status });
    }

    const token = data.access_token as string | undefined;
    if (!token) {
      return NextResponse.json({ detail: "No access_token in API response" }, { status: 502 });
    }

    let user: unknown = null;
    try {
      const me = await fetch(`${base}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (me.ok) {
        user = JSON.parse(await me.text());
      }
    } catch (err) {
      console.error("[api/auth/login] /users/me failed:", err);
    }

    const opts = authCookieOptions();
    const r = NextResponse.json({ user });
    r.cookies.set(AUTH_COOKIE_NAME, token, {
      ...opts,
      maxAge: AUTH_COOKIE_MAX_AGE_SEC,
    });
    return r;
  } catch (err) {
    console.error("[api/auth/login] unexpected:", base, err);
    return NextResponse.json({ detail: "Login handler failed" }, { status: 500 });
  }
}
