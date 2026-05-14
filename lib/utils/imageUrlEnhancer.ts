"use server";

// Directus stores image references as UUIDs that resolve directly to
// /assets/<uuid>, so no async DB lookup is needed. These helpers exist
// only to preserve the call-site shape from the Supabase era.

const baseUrl = (
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  "https://admin.commons-hub.at"
).replace(/\/$/, "");

function buildUrl(uuid: unknown): string {
  return uuid ? `${baseUrl}/assets/${String(uuid)}` : "";
}

/**
 * Add a resolved image URL to each item. Mirrors the pre-Directus signature.
 * The `bucketName` arg is retained for compatibility and ignored.
 */
export async function enhanceWithImageUrls<T extends Record<string, unknown>>(
  items: T[],
  imageFieldName: keyof T & string = "image" as keyof T & string,
  outputFieldName: string = "image_url",
): Promise<(T & Record<string, string>)[]> {
  if (!items || items.length === 0) return items as (T & Record<string, string>)[];
  return items.map((item) => {
    const url = buildUrl(item[imageFieldName]);
    return { ...item, [outputFieldName]: url } as T & Record<string, string>;
  });
}

/**
 * Add resolved image URLs to nested children. Mirrors the pre-Directus signature.
 */
export async function enhanceNestedWithImageUrls<
  T extends Record<string, unknown>,
  U extends Record<string, unknown>,
>(
  items: T[],
  nestedFieldName: keyof T & string,
  imageFieldName: keyof U & string = "image" as keyof U & string,
  outputFieldName: string = "image_url",
): Promise<T[]> {
  if (!items || items.length === 0) return items;
  return items.map((item) => {
    const nested = item[nestedFieldName] as unknown as U[] | undefined;
    if (!nested || !Array.isArray(nested)) return item;
    const enhancedChildren = nested.map((n) => ({
      ...n,
      [outputFieldName]: buildUrl(n[imageFieldName]),
    }));
    return { ...item, [nestedFieldName]: enhancedChildren } as T;
  });
}
