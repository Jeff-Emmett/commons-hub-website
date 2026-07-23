#!/usr/bin/env node
// Machine-translate the English content snapshot into the other locales.
// First-pass MT — flag for native review. Re-runnable; skips nothing destructive.
//
//   LITELLM_API_KEY=... node scripts/translate-snapshot.mjs [de hu cs sk]
//
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ENDPOINT = process.env.LITELLM_URL || "https://llm.jeffemmett.com";
const MODEL = process.env.LITELLM_MODEL || "local-flagship";
const KEY = process.env.LITELLM_API_KEY;
if (!KEY) { console.error("LITELLM_API_KEY required"); process.exit(1); }

const SNAP = join(process.cwd(), "content", "snapshot");
const EN = join(SNAP, "en");
const LANGS = process.argv.slice(2).length ? process.argv.slice(2) : ["de", "hu", "cs", "sk"];
const LANG_NAME = { de: "German", hu: "Hungarian", cs: "Czech", sk: "Slovak" };

// keys whose string values are natural language worth translating
const TRANSLATE = new Set([
  "title", "subtitle", "heading", "subheading", "description", "summary",
  "excerpt", "content", "body", "text", "quote", "label", "caption", "intro",
  "question", "answer", "role", "bio", "tagline", "name_of_section",
]);
// never translate these (identifiers, dates, media, contact, geo proper nouns)
const SKIP = new Set([
  "id", "sort", "status", "slug", "email", "color", "icon", "image", "image_url",
  "file", "url", "link", "href", "date_created", "date_updated", "valid_from",
  "valid_to", "startdatetime", "enddatetime", "location", "name", "page_id",
]);
const SKIP_VAL = /^(https?:\/\/|mailto:|#[0-9a-fA-F]{3,8}$|[0-9a-f]{8}-[0-9a-f]{4}-)|^\d{4}-\d\d-\d\dT|@/;

// Some `title` values are *lookup keys*, not prose — the code queries them
// verbatim (e.g. app/page.tsx filters carousels on title == "home_hero",
// getGalleryCarousels() on title starting with "gallery"). Translating those
// silently deletes whole sections in the non-EN locales, which is exactly what
// happened on the first MT pass: "home_hero" -> "startseite_held" wiped the
// homepage hero in DE/HU. Two guards below:
//   1. snake_case identifiers are never translated at all
//   2. a "gallery:" prefix is preserved; only the human part after it is sent
const KEY_LIKE = /^[a-z0-9]+(?:_[a-z0-9]+)+$/;
const KEEP_PREFIX = /^(gallery)(\s*:?\s*)/i;

// Splits "gallery: The House" into the machine prefix and the prose remainder.
function splitPrefix(v) {
  const m = typeof v === "string" ? v.match(KEEP_PREFIX) : null;
  if (!m) return { prefix: "", rest: v };
  return { prefix: m[0], rest: v.slice(m[0].length) };
}

// Long rich-text bodies are left in English (flagged for human long-form
// translation) — first-pass MT of large HTML is slow and low quality.
const MAX_LEN = Number(process.env.MT_MAX_LEN || 600);
const isTranslatableKey = (k) => TRANSLATE.has(k) && !SKIP.has(k);
const isTranslatableVal = (v) =>
  typeof v === "string" && v.trim().length > 1 && v.trim().length <= MAX_LEN &&
  /[A-Za-z]/.test(v) && !SKIP_VAL.test(v.trim()) && !KEY_LIKE.test(v.trim());

// The unit actually sent to the LLM: the prose part of a value, or null when
// the value must stay verbatim.
function translatableUnit(key, v) {
  if (!isTranslatableKey(key) || !isTranslatableVal(v)) return null;
  const { rest } = splitPrefix(v);
  if (typeof rest !== "string" || !isTranslatableVal(rest)) return null;
  return rest;
}

// ---- collect unique strings ----
function collect(node, key, out) {
  if (Array.isArray(node)) { node.forEach((n) => collect(n, key, out)); return; }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) collect(v, k, out);
    return;
  }
  const unit = translatableUnit(key, node);
  if (unit !== null) out.add(unit);
}

// Same traversal as collect(), but preserves order into an array — used to pair
// EN strings with a previous run's translations by position (resume mode).
function collectOrdered(node, key, out) {
  if (Array.isArray(node)) { node.forEach((n) => collectOrdered(n, key, out)); return; }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) collectOrdered(v, k, out);
    return;
  }
  const unit = translatableUnit(key, node);
  if (unit !== null) out.push(unit);
}

// ---- rewrite using a translation map ----
function rewrite(node, key, map) {
  if (Array.isArray(node)) return node.map((n) => rewrite(n, key, map));
  if (node && typeof node === "object") {
    const o = {};
    for (const [k, v] of Object.entries(node)) o[k] = rewrite(v, k, map);
    return o;
  }
  const unit = translatableUnit(key, node);
  if (unit !== null && map.has(unit)) return splitPrefix(node).prefix + map.get(unit);
  return node;
}

async function llm(text, langName) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Number(process.env.MT_TIMEOUT || 30000));
  const res = await fetch(`${ENDPOINT}/v1/chat/completions`, {
    signal: ctrl.signal,
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      messages: [
        { role: "system", content:
          `You are a professional translator. Translate the user's text from English to ${langName}. ` +
          `Preserve all HTML tags, markdown, URLs, email addresses, numbers and {placeholders} exactly. ` +
          `Keep brand and place names (Commons Hub, Reichenau, Höllental) untranslated. ` +
          `Return ONLY the translation with no quotes or commentary.` },
        { role: "user", content: text },
      ],
    }),
  });
  clearTimeout(timer);
  if (!res.ok) throw new Error(`LLM ${res.status}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content?.trim() ?? text;
}

async function translateLang(lang) {
  const langName = LANG_NAME[lang] || lang;
  const files = readdirSync(EN).filter((f) => f.endsWith(".json"));

  // gather all unique strings across the whole snapshot for this lang
  const uniq = new Set();
  for (const f of files) collect(JSON.parse(readFileSync(join(EN, f), "utf8")), "", uniq);
  const items = [...uniq];
  console.log(`[${lang}] ${items.length} unique strings to translate`);

  const map = new Map();
  // Resume: seed from a previous run so we only call the LLM for gaps (strings
  // still equal to EN). Lets repeated runs converge coverage cheaply.
  const outDir = join(SNAP, lang);
  let seeded = 0;
  for (const f of files) {
    const prev = join(outDir, f);
    try {
      const en = JSON.parse(readFileSync(join(EN, f), "utf8"));
      const tr = JSON.parse(readFileSync(prev, "utf8"));
      const ea = [], ta = [];
      collectOrdered(en, "", ea); collectOrdered(tr, "", ta);
      for (let i = 0; i < ea.length; i++) {
        if (ta[i] !== undefined && ta[i] !== ea[i] && !map.has(ea[i])) {
          map.set(ea[i], ta[i]); seeded++;
        }
      }
    } catch { /* no previous file */ }
  }
  if (seeded) console.log(`  [${lang}] seeded ${seeded} from previous run`);

  let done = 0;
  const POOL = Number(process.env.MT_POOL || 4);
  async function worker(queue) {
    for (const text of queue) {
      if (map.has(text)) { done++; continue; }
      try { map.set(text, await llm(text, langName)); }
      catch (e) { map.set(text, text); console.warn(`  ! kept EN: ${e.message}`); }
      if (++done % 25 === 0) console.log(`  [${lang}] ${done}/${items.length}`);
    }
  }
  const chunks = Array.from({ length: POOL }, (_, i) => items.filter((_, idx) => idx % POOL === i));
  await Promise.all(chunks.map(worker));

  mkdirSync(outDir, { recursive: true });
  for (const f of files) {
    const data = JSON.parse(readFileSync(join(EN, f), "utf8"));
    writeFileSync(join(outDir, f), JSON.stringify(rewrite(data, "", map), null, 2));
  }
  writeFileSync(join(outDir, "_meta.json"),
    JSON.stringify({ locale: lang, source: "mt", model: MODEL, needsReview: true }, null, 2));
  console.log(`[${lang}] wrote ${files.length} files -> ${outDir}`);
}

for (const lang of LANGS) await translateLang(lang);
console.log("Done. Non-EN content is machine-translated — flag for native review.");
