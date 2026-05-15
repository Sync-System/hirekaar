import "server-only";

import { cookies } from "next/headers";

import { apiInternalBase } from "@/lib/api-internal";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(AUTH_COOKIE_NAME)?.value;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${apiInternalBase()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function getMeJson(): Promise<Record<string, unknown> | null> {
  const res = await apiFetch("/users/me");
  if (!res.ok) return null;
  return (await res.json()) as Record<string, unknown>;
}
