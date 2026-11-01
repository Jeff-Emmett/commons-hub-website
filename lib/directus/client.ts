import "server-only";
import { USE_STATIC_CONTENT, activeLocale } from "@/lib/content/staticStore";
import { mergeTranslations, withTranslations } from "@/lib/directus/translations";

const DIRECTUS_URL =
  process.env.DIRECTUS_URL?.replace(/\/$/, "") || "http://commons-hub-directus:8055";

export interface DirectusQuery {
  fields?: string | string[];
  filter?: Record<string, unknown>;
  sort?: string | string[];
  limit?: number;
  offset?: number;
  page?: number;
  search?: string;
  deep?: Record<string, unknown>;
}

function buildQuery(q: DirectusQuery): string {
  const params = new URLSearchParams();
  if (q.fields) params.set("fields", Array.isArray(q.fields) ? q.fields.join(",") : q.fields);
  if (q.filter) params.set("filter", JSON.stringify(q.filter));
  if (q.sort) params.set("sort", Array.isArray(q.sort) ? q.sort.join(",") : q.sort);
  if (q.limit !== undefined) params.set("limit", String(q.limit));
  if (q.offset !== undefined) params.set("offset", String(q.offset));
  if (q.page !== undefined) params.set("page", String(q.page));
  if (q.search) params.set("search", q.search);
  if (q.deep) params.set("deep", JSON.stringify(q.deep));
  const s = params.toString();
  return s ? `?${s}` : "";
}

interface DirectusErrorResponse {
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
}

/**
 * Every public (token-less) read is cached by Next under this tag for at most
 * REVALIDATE_SECONDS, and dropped at once when Directus calls /api/revalidate
 * (the "Refresh website on content change" flow). Authenticated reads -- the
 * in-app admin -- are never cached.
 */
export const CONTENT_TAG = "directus-content";
const REVALIDATE_SECONDS = 60;

async function request<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = init;
  const isRead = !rest.method || rest.method === "GET";
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...rest,
    ...(isRead && !token
      ? { next: { revalidate: REVALIDATE_SECONDS, tags: [CONTENT_TAG] } }
      : { cache: "no-store" as const }),
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = body as DirectusErrorResponse;
    const msg = err.errors?.[0]?.message ?? `Directus ${res.status}`;
    const error = new Error(msg) as Error & { status?: number; code?: string };
    error.status = res.status;
    error.code = err.errors?.[0]?.extensions?.code;
    throw error;
  }
  return body as T;
}

/** Directus unreachable or failing (not a 4xx about the query itself). */
function isOutage(err: unknown): boolean {
  const status = (err as { status?: number }).status;
  return status === undefined || status >= 500;
}

/**
 * The captured snapshot (content/snapshot/<locale>/), served when Directus is
 * down so the site keeps its last known content instead of rendering empty.
 * Refresh it with scripts/capture-directus.mjs.
 */
async function staticRows<T>(collection: string, query: DirectusQuery, locale: string): Promise<T[]> {
  const { queryStatic } = await import("@/lib/content/staticStore");
  return queryStatic<T>(collection, query, locale);
}

export async function readItems<T>(
  collection: string,
  query: DirectusQuery = {},
  token?: string,
): Promise<T[]> {
  // Authenticated callers are the in-app admin editing raw rows: no language
  // merging (it would save German into the English fields) and no fallback.
  return readItemsAs<T>(collection, query, token ? undefined : await activeLocale(), token);
}

/**
 * readItems for an explicit locale (undefined = raw rows, no merging). For
 * callers that run before the request locale is resolvable, e.g. the next-intl
 * request config itself.
 */
export async function readItemsAs<T>(
  collection: string,
  query: DirectusQuery,
  locale: string | undefined,
  token?: string,
): Promise<T[]> {
  if (USE_STATIC_CONTENT && locale) return staticRows<T>(collection, query, locale);
  try {
    const q = locale ? withTranslations(collection, query, locale) : query;
    const body = await request<{ data: T[] | T | null }>(
      `/items/${collection}${buildQuery(q)}`,
      { token },
    );
    // A singleton collection (site_settings) answers with one object, not rows.
    const rows = Array.isArray(body.data) ? body.data : body.data ? [body.data] : [];
    return locale ? mergeTranslations(rows) : rows;
  } catch (err) {
    console.error(`Directus readItems(${collection}) failed:`, (err as Error).message);
    return locale && isOutage(err) ? staticRows<T>(collection, query, locale) : [];
  }
}

export async function readItem<T>(
  collection: string,
  id: string | number,
  query: Omit<DirectusQuery, "filter" | "limit" | "offset" | "page"> = {},
  token?: string,
): Promise<T | null> {
  const locale = token ? undefined : await activeLocale();
  if (USE_STATIC_CONTENT && locale) {
    const { getItemStatic } = await import("@/lib/content/staticStore");
    return getItemStatic<T>(collection, id, locale);
  }
  try {
    const q = locale ? withTranslations(collection, query, locale) : query;
    const body = await request<{ data: T }>(
      `/items/${collection}/${id}${buildQuery(q)}`,
      { token },
    );
    return locale ? mergeTranslations(body.data ?? null) : (body.data ?? null);
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 403 || status === 404) return null;
    console.error(`Directus readItem(${collection}/${id}) failed:`, (err as Error).message);
    return null;
  }
}

export async function readSingleton<T>(
  collection: string,
  query: DirectusQuery = {},
  token?: string,
): Promise<T | null> {
  const rows = await readItems<T>(collection, { ...query, limit: 1 }, token);
  return rows[0] ?? null;
}

export async function createItem<T>(
  collection: string,
  payload: Partial<T>,
  token?: string,
): Promise<T | null> {
  try {
    const body = await request<{ data: T }>(`/items/${collection}`, {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
    return body.data ?? null;
  } catch (err) {
    console.error(`Directus createItem(${collection}) failed:`, (err as Error).message);
    return null;
  }
}

export async function updateItem<T>(
  collection: string,
  id: string | number,
  payload: Partial<T>,
  token?: string,
): Promise<T | null> {
  try {
    const body = await request<{ data: T }>(`/items/${collection}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      token,
    });
    return body.data ?? null;
  } catch (err) {
    console.error(`Directus updateItem(${collection}/${id}) failed:`, (err as Error).message);
    throw err;
  }
}

export async function deleteItem(
  collection: string,
  id: string | number,
  token?: string,
): Promise<boolean> {
  try {
    await request<unknown>(`/items/${collection}/${id}`, {
      method: "DELETE",
      token,
    });
    return true;
  } catch (err) {
    console.error(`Directus deleteItem(${collection}/${id}) failed:`, (err as Error).message);
    throw err;
  }
}

export async function deleteItems(
  collection: string,
  ids: (string | number)[],
  token?: string,
): Promise<boolean> {
  if (!ids || ids.length === 0) return true;
  try {
    await request<unknown>(`/items/${collection}`, {
      method: "DELETE",
      body: JSON.stringify(ids),
      token,
    });
    return true;
  } catch (err) {
    console.error(`Directus deleteItems(${collection}) failed:`, (err as Error).message);
    throw err;
  }
}

export async function countItems(
  collection: string,
  filter?: Record<string, unknown>,
  token?: string,
): Promise<number> {
  if (USE_STATIC_CONTENT && !token) {
    const { countStatic } = await import("@/lib/content/staticStore");
    return countStatic(collection, filter, await activeLocale());
  }
  try {
    const params = new URLSearchParams();
    params.set("aggregate[count]", "*");
    if (filter) params.set("filter", JSON.stringify(filter));
    const body = await request<{ data: Array<{ count: { "*": string | number } | string | number }> }>(
      `/items/${collection}?${params}`,
      { token },
    );
    const raw = body.data?.[0]?.count;
    if (typeof raw === "object" && raw !== null) {
      return Number((raw as { "*"?: string | number })["*"] ?? 0);
    }
    return Number(raw ?? 0);
  } catch (err) {
    console.error(`Directus countItems(${collection}) failed:`, (err as Error).message);
    return 0;
  }
}

export async function readItemsWithCount<T>(
  collection: string,
  query: DirectusQuery = {},
  token?: string,
): Promise<{ data: T[]; total: number }> {
  const [data, total] = await Promise.all([
    readItems<T>(collection, query, token),
    countItems(collection, query.filter, token),
  ]);
  return { data, total };
}
