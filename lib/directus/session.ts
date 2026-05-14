import "server-only";

import { cookies } from "next/headers";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/directus/cookies";
import { refresh } from "@/lib/directus/auth";

/**
 * Get the user's current Directus access token, refreshing if needed.
 * Returns null if no session — caller decides whether to fall back to
 * anonymous (public) access or reject.
 */
export async function getDirectusToken(): Promise<string | null> {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (access) return access;

  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  try {
    const refreshed = await refresh(refreshToken);
    return refreshed.access_token;
  } catch {
    return null;
  }
}
