import { type NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/directus/cookies";
import {
  LOCALE_COOKIE,
  LOCALE_HEADER,
  LOCALE_SOURCE_COOKIE,
  detectLocale,
  isLocale,
} from "@/lib/i18n/geo";

const PUBLIC_PREFIXES = [
  "/page",
  "/category",
  "/post",
  "/booking",
  "/linktree",
  "/events",
  "/blog",
  "/gallery",
  "/accommodation",
  "/event-venue",
  "/event-toolbox",
  "/about",
  "/community",
  "/surroundings",
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

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * First-visit language detection (geo-IP → Accept-Language → English).
 *
 * Only runs when the visitor has no NEXT_LOCALE cookie, so an explicit pick in
 * the <LanguageSwitcher/> is never overridden. The detected locale is written
 * onto the *request* (so this very render is already translated) and onto the
 * response cookie (so it sticks and stays user-editable afterwards).
 */
function applyDetectedLocale(request: NextRequest): boolean {
  const existing = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(existing)) return false;

  const locale = detectLocale(request.headers);
  request.cookies.set(LOCALE_COOKIE, locale);
  request.headers.set(LOCALE_HEADER, locale);
  return true;
}

function persistLocale(request: NextRequest, response: NextResponse) {
  const locale = request.headers.get(LOCALE_HEADER);
  if (!locale) return response;
  const options = { path: "/", maxAge: ONE_YEAR, sameSite: "lax" as const };
  response.cookies.set(LOCALE_COOKIE, locale, options);
  response.cookies.set(LOCALE_SOURCE_COOKIE, "auto", options);
  return response;
}

export async function middleware(request: NextRequest) {
  applyDetectedLocale(request);

  // `request` is forwarded so the cookie/header set above is visible to the
  // server components rendering this request (see i18n/request.ts).
  const response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return persistLocale(request, response);

  const hasSession =
    request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);
  if (hasSession) return persistLocale(request, response);

  const url = request.nextUrl.clone();
  url.pathname = "/auth/login";
  url.searchParams.set("next", pathname);
  return persistLocale(request, NextResponse.redirect(url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
