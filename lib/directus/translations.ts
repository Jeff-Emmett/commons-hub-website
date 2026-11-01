import spec from "@/cms/translations.json";
import type { DirectusQuery } from "@/lib/directus/client";

// Directus translations, read side. English is each item's own fields;
// <collection>_translations rows hold DE/HU/CS/SK and override only the fields
// that are filled in. cms/translations.json says which collections are
// translated and which nested relations a query can expand into, so a query
// written against the English schema (fields: ["*", "carousel_items.*"]) is
// widened here to also fetch the active language's translation rows, and the
// result is folded back into the same shape. Callers never see `translations`.

type CollectionSpec = { fields: Record<string, string>; relations?: Record<string, string> };
const COLLECTIONS = (spec as { collections: Record<string, CollectionSpec> }).collections;

export const DEFAULT_LOCALE = "en";

const translatable = (c: string) => Object.keys(COLLECTIONS[c]?.fields ?? {}).length > 0;
const asArray = (f: DirectusQuery["fields"]) => (Array.isArray(f) ? f : f ? f.split(",") : ["*"]);

type Deep = Record<string, unknown>;

/** Widen `query` on `collection` so it also returns `locale`'s translations. */
export function withTranslations(
  collection: string,
  query: DirectusQuery,
  locale: string,
): DirectusQuery {
  if (locale === DEFAULT_LOCALE) return query;
  const fields = asArray(query.fields);
  const extra: string[] = [];
  const deep: Deep = { ...(query.deep ?? {}) };
  const langFilter = { _filter: { languages_code: { _eq: locale } } };

  const visit = (coll: string, prefix: string, node: Deep) => {
    if (translatable(coll)) {
      extra.push(`${prefix}translations.*`);
      node.translations = langFilter;
    }
    for (const [rel, target] of Object.entries(COLLECTIONS[coll]?.relations ?? {})) {
      if (!fields.some((f) => f.startsWith(`${prefix}${rel}.`))) continue;
      const child: Deep = { ...((node[rel] as Deep) ?? {}) };
      node[rel] = child;
      visit(target, `${prefix}${rel}.`, child);
    }
  };
  visit(collection, "", deep);
  if (!extra.length) return query;
  return { ...query, fields: [...fields, ...extra], deep };
}

const isRow = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Fold translation rows into their item, recursively. A translated field wins
 * only when it is a non-empty string, so a blank translation shows English.
 */
export function mergeTranslations<T>(value: T): T {
  if (Array.isArray(value)) return value.map(mergeTranslations) as T;
  if (!isRow(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (k !== "translations") out[k] = Array.isArray(v) || isRow(v) ? mergeTranslations(v) : v;
  }
  const tr = Array.isArray(value.translations) ? value.translations.find(isRow) : undefined;
  if (tr) {
    for (const [k, v] of Object.entries(tr)) {
      if (k === "id" || k === "languages_code" || k.endsWith("_id")) continue;
      if (typeof v === "string" && v.trim() !== "") out[k] = v;
    }
  }
  return out as T;
}
