#!/usr/bin/env node
// Repair machine-key fields that the first machine-translation pass translated.
//
// Some `title` values in the content snapshot are lookup keys the code queries
// verbatim — app/page.tsx filters carousels on title == "home_hero",
// getGalleryCarousels() on title starting with "gallery". The MT pass rendered
// those as "startseite_held" / "Galerie: …", so the queries matched nothing and
// the homepage hero and the whole gallery silently vanished in DE/HU/CS/SK.
//
// This walks each non-EN snapshot alongside the EN one and restores:
//   * snake_case identifiers  -> exactly the EN value
//   * "gallery:" prefixes     -> EN prefix + the translated remainder
//
// translate-snapshot.mjs now guards against reintroducing either, so this is a
// one-shot fix for snapshots produced before that guard existed.
//
//   node scripts/repair-snapshot-keys.mjs           # dry run, prints changes
//   node scripts/repair-snapshot-keys.mjs --apply   # write the files
//
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const SNAP = join(process.cwd(), "content", "snapshot");
const EN = join(SNAP, "en");
const APPLY = process.argv.includes("--apply");
const LANGS = readdirSync(SNAP).filter((d) => d !== "en" && existsSync(join(SNAP, d)));

const KEY_LIKE = /^[a-z0-9]+(?:_[a-z0-9]+)+$/;
const KEEP_PREFIX = /^(gallery)(\s*:?\s*)/i;

const changes = [];

// Rebuild a prefixed value: EN's machine prefix + the locale's own prose part
// (everything after its first colon, if it has one).
function withEnPrefix(enValue, localeValue) {
  const prefix = enValue.match(KEEP_PREFIX)[0];
  const colon = String(localeValue).indexOf(":");
  const rest = colon >= 0 ? String(localeValue).slice(colon + 1).trim() : String(localeValue);
  return prefix + rest;
}

// Walks EN and the locale copy in lockstep — the snapshots share a structure
// because the locale files are a value-level rewrite of the EN ones.
function repair(en, loc, path, lang, file) {
  if (Array.isArray(en)) {
    if (!Array.isArray(loc)) return loc;
    return en.map((e, i) => repair(e, loc[i], `${path}[${i}]`, lang, file));
  }
  if (en && typeof en === "object") {
    if (!loc || typeof loc !== "object") return loc;
    const out = { ...loc };
    for (const [k, v] of Object.entries(en)) {
      out[k] = repair(v, loc[k], path ? `${path}.${k}` : k, lang, file);
    }
    return out;
  }
  if (typeof en !== "string" || typeof loc !== "string" || en === loc) return loc;

  const trimmed = en.trim();
  let fixed = null;
  if (KEY_LIKE.test(trimmed)) fixed = en;
  else if (KEEP_PREFIX.test(trimmed)) fixed = withEnPrefix(en, loc);
  if (fixed === null || fixed === loc) return loc;

  changes.push({ lang, file, path, from: loc, to: fixed });
  return fixed;
}

for (const lang of LANGS) {
  const dir = join(SNAP, lang);
  for (const file of readdirSync(EN).filter((f) => f.endsWith(".json"))) {
    const locPath = join(dir, file);
    if (!existsSync(locPath)) continue;
    const en = JSON.parse(readFileSync(join(EN, file), "utf8"));
    const loc = JSON.parse(readFileSync(locPath, "utf8"));
    const repaired = repair(en, loc, "", lang, file);
    if (APPLY) writeFileSync(locPath, JSON.stringify(repaired, null, 2) + "\n");
  }
}

for (const c of changes) {
  console.log(`${c.lang}/${c.file} ${c.path}\n   - ${c.from}\n   + ${c.to}`);
}
console.log(
  `\n${changes.length} value(s) ${APPLY ? "repaired" : "would be repaired"} across ${LANGS.length} locales` +
    (APPLY ? "" : " — re-run with --apply to write"),
);
