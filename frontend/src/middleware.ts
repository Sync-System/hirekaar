import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("hk_token");
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
