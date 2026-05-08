import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/directus/cookies";

const PUBLIC_PREFIXES = [
  "/",
  "/page",
  "/category",
  "/post",
  "/booking",
  "/linktree",
  "/events",
  "/pitchdecks",
  "/brochures",
  "/auth",
  "/api/auth",
  "/api/og",
];

function isPublic(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => prefix !== "/" && pathname.startsWith(prefix),
  );
}

export async function updateSession(request: NextRequest) {
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
