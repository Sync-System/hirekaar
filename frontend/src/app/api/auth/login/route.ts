import { NextResponse } from "next/server";

import { apiInternalBase } from "@/lib/api-internal";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const base = apiInternalBase();
  let res: Response;
  try {
    res = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[api/auth/login] upstream fetch failed:", err);
    return NextResponse.json(
      {
        detail:
          "Cannot reach the API backend. Start FastAPI or set API_BASE_URL (e.g. http://127.0.0.1:8000 for local dev).",
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

  const r = NextResponse.json({ user });
  r.cookies.set("hk_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return r;
}
