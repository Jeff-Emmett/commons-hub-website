import { type NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/directus/cookies";

const PUBLIC_PREFIXES = [
  "/page",
  "/category",
  "/post",
  "/booking",
  "/linktree",
  "/events",
  "/pitchdecks",
  "/brochures",
  "/auth",
];

function isPublic(pathname: string) {
  if (pathname === "/") return true;
  // API routes manage their own auth — no middleware redirects.
  if (pathname.startsWith("/api/")) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return response;

  const hasSession =
    request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);
  if (hasSession) return response;

  const url = request.nextUrl.clone();
  url.pathname = "/auth/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
