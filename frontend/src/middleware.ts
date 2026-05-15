import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (
    (pathname.startsWith("/customer") ||
      pathname.startsWith("/worker") ||
      pathname.startsWith("/admin")) &&
    !token
  ) {
    const u = new URL("/login", request.url);
    u.searchParams.set("next", pathname);
    return NextResponse.redirect(u);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/customer/:path*", "/worker/:path*", "/admin/:path*"],
};
