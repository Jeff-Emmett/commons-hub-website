import "server-only";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/directus/cookies";

export { ACCESS_COOKIE, REFRESH_COOKIE };

const DIRECTUS_URL =
  process.env.DIRECTUS_URL?.replace(/\/$/, "") || "https://admin.commons-hub.at";

export type DirectusUser = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: { id: string; name: string } | null;
};

type LoginResponse = {
  data: {
    access_token: string;
    refresh_token: string;
    expires: number;
  };
};

type ErrorResponse = {
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
};

async function directusFetch<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = init;
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...rest,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const text = await res.text();
  const body = text ? (JSON.parse(text) as T & ErrorResponse) : ({} as T & ErrorResponse);
  if (!res.ok) {
    const message = body.errors?.[0]?.message ?? `Directus ${res.status}`;
    const err = new Error(message) as Error & { status?: number; code?: string };
    err.status = res.status;
    err.code = body.errors?.[0]?.extensions?.code;
    throw err;
  }
  return body as T;
}

export async function login(email: string, password: string) {
  const { data } = await directusFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, mode: "json" }),
  });
  await setSessionCookies(data.access_token, data.refresh_token, data.expires);
  return data;
}

export async function refresh(refreshToken: string) {
  const { data } = await directusFetch<LoginResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken, mode: "json" }),
  });
  await setSessionCookies(data.access_token, data.refresh_token, data.expires);
  return data;
}

export async function logout() {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    try {
      await directusFetch<unknown>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken, mode: "json" }),
      });
    } catch {
      // Token already revoked or expired — clear cookies anyway.
    }
  }
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export async function getCurrentUser(): Promise<DirectusUser | null> {
  const jar = await cookies();
  let access = jar.get(ACCESS_COOKIE)?.value;
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (!access && !refreshToken) return null;

  // NOTE: Directus 11 has no `directus_roles.admin_access` field (it moved
  // to `directus_policies`). Including an invalid field here makes Directus
  // silently return only `{ id }` — dropping email/first_name/role and
  // breaking the greeting and all role gating. Admin status is derived from
  // role.name via ROLE_ALIASES in AuthContext, so we only need safe fields.
  const meQuery = "?fields=id,email,first_name,last_name,role.id,role.name";

  const fetchMe = async (token: string) =>
    directusFetch<{ data: DirectusUser }>(`/users/me${meQuery}`, { token });

  if (access) {
    try {
      const { data } = await fetchMe(access);
      return data;
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status !== 401) return null;
    }
  }

  if (refreshToken) {
    try {
      const refreshed = await refresh(refreshToken);
      access = refreshed.access_token;
      const { data } = await fetchMe(access);
      return data;
    } catch {
      const jarReset = await cookies();
      jarReset.delete(ACCESS_COOKIE);
      jarReset.delete(REFRESH_COOKIE);
      return null;
    }
  }

  return null;
}

async function setSessionCookies(
  accessToken: string,
  refreshToken: string,
  expiresMs: number,
) {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(60, Math.floor(expiresMs / 1000) - 30),
  });
  jar.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
