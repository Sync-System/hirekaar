import { NextRequest, NextResponse } from "next/server";

import { apiInternalBase } from "@/lib/api-internal";

const ALLOWED_PREFIX = new Set(["users", "jobs", "wallet", "reviews", "admin", "public"]);

function targetPath(segments: string[]): string {
  return "/" + segments.join("/");
}

async function forward(
  method: string,
  req: NextRequest,
  segments: string[],
): Promise<Response> {
  if (segments.length === 0 || !ALLOWED_PREFIX.has(segments[0]!)) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const path = targetPath(segments) + url.search;
  const token = req.cookies.get("hk_token")?.value;
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let body: BodyInit | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const ct = req.headers.get("content-type");
    if (ct) headers.set("content-type", ct);
    body = await req.arrayBuffer();
  }
  return fetch(`${apiInternalBase()}${path}`, { method, headers, body });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  return forward("GET", req, path);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  return forward("POST", req, path);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  return forward("PATCH", req, path);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  return forward("PUT", req, path);
}
