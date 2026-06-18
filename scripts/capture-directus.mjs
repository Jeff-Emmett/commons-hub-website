#!/usr/bin/env node
// One-off capture of live Directus content into content/snapshot/en/<collection>.json
// so the site can run with Directus deactivated (USE_STATIC_CONTENT). Re-run to refresh.
//
//   DIRECTUS_CAPTURE_URL=https://admin.commons-hub.at node scripts/capture-directus.mjs
//
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE = (process.env.DIRECTUS_CAPTURE_URL || "https://admin.commons-hub.at").replace(/\/$/, "");
const OUT = join(process.cwd(), "content", "snapshot", "en");

// collection -> field expansion (relations embedded so the snapshot is self-contained)
const SPEC = {
  menu: "*,page_id.*",
  pages: "*,page_post.*,page_carousel.*,page_accordion.*,page_category.*",
  posts: "*,post_carousel.*,post_accordion.*",
  carousels: "*,carousel_items.*",
  accordions: "*,accordion_items.*",
  categories: "*,category_accordion.*,category_carousel.*,category_post.*",
  eventpages: "*",
  accommodation_offerings: "*",
  team_members: "*",
  // junction / relation tables some actions read directly
  category_post: "*",
  page_accordion: "*",
  page_carousel: "*",
  page_category: "*",
  post_accordion: "*",
  post_carousel: "*",
};

async function capture(collection, fields) {
  const url = `${BASE}/items/${collection}?fields=${encodeURIComponent(fields)}&limit=-1`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    console.warn(`  ! ${collection}: HTTP ${res.status} (skipped)`);
    return 0;
  }
  const body = await res.json();
  const data = body?.data ?? [];
  await writeFile(join(OUT, `${collection}.json`), JSON.stringify(data, null, 2));
  return Array.isArray(data) ? data.length : 0;
}

await mkdir(OUT, { recursive: true });
let total = 0;
for (const [collection, fields] of Object.entries(SPEC)) {
  const n = await capture(collection, fields);
  console.log(`  ${collection}: ${n} rows`);
  total += n;
}
console.log(`Captured ${total} rows across ${Object.keys(SPEC).length} collections -> ${OUT}`);
