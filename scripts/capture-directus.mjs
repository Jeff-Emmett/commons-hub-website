#!/usr/bin/env node
// Captures the website's content from Directus into content/snapshot/<locale>/
// <collection>.json -- one merged file per language, exactly as the public
// site sees it (anonymous read, translations folded in).
//
// The snapshot is the site's fallback: lib/directus/client.ts serves it when
// Directus is unreachable, and USE_STATIC_CONTENT=true serves only it. Re-run
// after larger content changes so the fallback stays close to the live site:
//
//   DIRECTUS_CAPTURE_URL=https://admin.commons-hub.at node scripts/capture-directus.mjs
//
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE = (process.env.DIRECTUS_CAPTURE_URL || "https://admin.commons-hub.at").replace(/\/$/, "");
const ROOT = join(process.cwd(), "content", "snapshot");
const SPEC = JSON.parse(await readFile(join(process.cwd(), "cms", "translations.json"), "utf8"));
const LOCALES = ["en", ...SPEC.languages.map((l) => l.code)];

// collection -> field expansion (relations embedded so the snapshot is self-contained)
const CAPTURE = {
  menu: "*,page_id.*",
  pages: "*,page_post.*,page_carousel.*,page_accordion.*,page_category.*,sections.*,sections.items.*",
  posts: "*,post_carousel.*,post_accordion.*",
  carousels: "*,carousel_items.*",
  accordions: "*,accordion_items.*",
  categories: "*,category_accordion.*,category_carousel.*,category_post.*",
  eventpages: "*",
  accommodation_offerings: "*",
  team_members: "*",
  site_settings: "*",
  ui_strings: "key,value",
  booking_options: "*",
  // junction / relation tables some actions read directly
  category_post: "*",
  page_accordion: "*",
  page_carousel: "*",
  page_category: "*",
  post_accordion: "*",
  post_carousel: "*",
};

const translatable = (c) => Object.keys(SPEC.collections[c]?.fields ?? {}).length > 0;

/** Same widening as lib/directus/translations.ts withTranslations(). */
function widen(collection, fields, locale) {
  if (locale === "en") return { fields, deep: null };
  const list = fields.split(",");
  const extra = [];
  const deep = {};
  const visit = (coll, prefix, node) => {
    if (translatable(coll)) {
      extra.push(`${prefix}translations.*`);
      node.translations = { _filter: { languages_code: { _eq: locale } } };
    }
    for (const [rel, target] of Object.entries(SPEC.collections[coll]?.relations ?? {})) {
      if (!list.some((f) => f.startsWith(`${prefix}${rel}.`))) continue;
      node[rel] = node[rel] ?? {};
      visit(target, `${prefix}${rel}.`, node[rel]);
    }
  };
  visit(collection, "", deep);
  return { fields: [...list, ...extra].join(","), deep: extra.length ? deep : null };
}

/** Same folding as lib/directus/translations.ts mergeTranslations(). */
function merge(v) {
  if (Array.isArray(v)) return v.map(merge);
  if (!v || typeof v !== "object") return v;
  const out = {};
  for (const [k, x] of Object.entries(v)) if (k !== "translations") out[k] = merge(x);
  const tr = Array.isArray(v.translations) ? v.translations.find((t) => t && typeof t === "object") : null;
  if (tr) {
    for (const [k, x] of Object.entries(tr)) {
      if (k === "id" || k === "languages_code" || k.endsWith("_id")) continue;
      if (typeof x === "string" && x.trim() !== "") out[k] = x;
    }
  }
  return out;
}

async function capture(collection, fields, locale) {
  const q = widen(collection, fields, locale);
  const params = new URLSearchParams({ fields: q.fields, limit: "-1" });
  if (q.deep) params.set("deep", JSON.stringify(q.deep));
  const res = await fetch(`${BASE}/items/${collection}?${params}`, { headers: { accept: "application/json" } });
  if (!res.ok) {
    console.warn(`  ! ${locale}/${collection}: HTTP ${res.status} (skipped)`);
    return 0;
  }
  const body = await res.json();
  // Singletons come back as one object; the static store expects rows.
  const rows = Array.isArray(body?.data) ? body.data : body?.data ? [body.data] : [];
  await writeFile(join(ROOT, locale, `${collection}.json`), JSON.stringify(merge(rows), null, 2) + "\n");
  return rows.length;
}

for (const locale of LOCALES) {
  await mkdir(join(ROOT, locale), { recursive: true });
  let total = 0;
  for (const [collection, fields] of Object.entries(CAPTURE)) total += await capture(collection, fields, locale);
  await writeFile(
    join(ROOT, locale, "_meta.json"),
    JSON.stringify({ locale, source: "directus", captured_from: BASE }, null, 2) + "\n",
  );
  console.log(`${locale}: ${total} rows`);
}
