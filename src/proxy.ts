import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants/auth";

const PUBLIC_PATHS = new Set(["/login", "/signup", "/forgot-password"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isAsset = /\.[a-z0-9]+$/i.test(pathname);
  if (isAsset) return NextResponse.next();

  const isPublic = [...PUBLIC_PATHS].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isPublic) return NextResponse.next();

  const hasSessionCookie = !!request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!hasSessionCookie) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico)(?!.*\\.[a-z]{2,}$).*)",
  ],
};

