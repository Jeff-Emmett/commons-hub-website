#!/usr/bin/env node
// Generate native-speaker review checklists for the machine-translated strings.
// Pairs each EN source string with its translation and buckets them:
//   - MT to review      (translated; differs from EN)
//   - unchanged/verify  (still equals EN — abort fallback or proper noun)
//   - long-form (EN)     (>MAX_LEN; intentionally left English for human translation)
//
//   node scripts/build-review-checklist.mjs
//
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SNAP = join(ROOT, "content", "snapshot");
const MSGS = join(ROOT, "messages");
const OUT = join(ROOT, "docs", "i18n-review");
const LANGS = ["de", "hu", "cs", "sk"];
const NAME = { de: "German", hu: "Hungarian", cs: "Czech", sk: "Slovak", en: "English" };
const MAX_LEN = 600;

const TRANSLATE = new Set(["title","subtitle","heading","subheading","description","summary","excerpt","content","body","text","quote","label","caption","intro","question","answer","role","bio","tagline"]);
const SKIP = new Set(["id","sort","status","slug","email","color","icon","image","image_url","file","url","link","href","date_created","date_updated","valid_from","valid_to","startdatetime","enddatetime","location","name","page_id"]);
const SKIP_VAL = /^(https?:\/\/|mailto:|#[0-9a-fA-F]{3,8}$|[0-9a-f]{8}-[0-9a-f]{4}-)|^\d{4}-\d\d-\d\dT|@/;
const transKey = (k) => TRANSLATE.has(k) && !SKIP.has(k);
const transValShort = (v) => typeof v === "string" && v.trim().length > 1 && v.trim().length <= MAX_LEN && /[A-Za-z]/.test(v) && !SKIP_VAL.test(v.trim());
const transValLong = (v) => typeof v === "string" && v.trim().length > MAX_LEN && /[A-Za-z]/.test(v) && !SKIP_VAL.test(v.trim());

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\r?\n/g, " ⏎ ").trim();
const clip = (s, n = 320) => (s.length > n ? s.slice(0, n) + " …[truncated]" : s);

// walk two parallel structures, yielding {path, key, en, tr}
function pairWalk(en, tr, key, path, cb) {
  if (Array.isArray(en)) { en.forEach((e, i) => pairWalk(e, tr?.[i], key, `${path}[${i}]`, cb)); return; }
  if (en && typeof en === "object") {
    for (const [k, v] of Object.entries(en)) pairWalk(v, tr?.[k], k, path ? `${path}.${k}` : k, cb);
    return;
  }
  cb({ path, key, en, tr });
}

// flatten a messages catalog to dotted keys
function flat(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    if (k === "_meta") continue;
    if (v && typeof v === "object") flat(v, prefix ? `${prefix}.${k}` : k, out);
    else out[prefix ? `${prefix}.${k}` : k] = v;
  }
  return out;
}

function buildLang(lang) {
  const review = []; const verify = []; const longform = [];

  // 1. UI chrome catalog
  const enMsg = flat(JSON.parse(readFileSync(join(MSGS, "en.json"), "utf8")), "", {});
  const trMsg = flat(JSON.parse(readFileSync(join(MSGS, `${lang}.json`), "utf8")), "", {});
  for (const [k, en] of Object.entries(enMsg)) {
    const tr = trMsg[k];
    const row = { loc: `messages · ${k}`, en, tr };
    if (tr === undefined) continue;
    (tr !== en ? review : verify).push(row);
  }

  // 2. content snapshot
  const files = readdirSync(join(SNAP, "en")).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const coll = f.replace(/\.json$/, "");
    const en = JSON.parse(readFileSync(join(SNAP, "en", f), "utf8"));
    const trPath = join(SNAP, lang, f);
    const tr = existsSync(trPath) ? JSON.parse(readFileSync(trPath, "utf8")) : en;
    if (!Array.isArray(en)) continue;
    en.forEach((rec, i) => {
      const rid = rec?.id ?? rec?.slug ?? i;
      pairWalk(rec, tr?.[i], "", "", ({ path, key, en: ev, tr: tv }) => {
        if (!transKey(key)) return;
        if (transValLong(ev)) { longform.push({ loc: `${coll}#${rid} · ${path}`, en: ev }); return; }
        if (!transValShort(ev)) return;
        const row = { loc: `${coll}#${rid} · ${path}`, en: ev, tr: tv };
        (tv !== ev ? review : verify).push(row);
      });
    });
  }
  return { review, verify, longform };
}

function render(lang, { review, verify, longform }) {
  const L = lang.toUpperCase();
  const lines = [];
  lines.push(`# Native review — ${NAME[lang]} (${L})`, "");
  lines.push(`Machine-translated first pass. Tick each box once a native speaker has`,
             `confirmed or corrected the ${L} text in the source file. Correct values`,
             `directly in \`messages/${lang}.json\` (UI) or \`content/snapshot/${lang}/*.json\``,
             `(content), then re-run a build. See docs/i18n-plan.md.`, "");
  lines.push(`**Summary:** ${review.length} to review · ${verify.length} unchanged (verify/translate) · ${longform.length} long-form left in English.`, "");

  lines.push(`## 1. To review — machine-translated (${review.length})`, "");
  for (const r of review) {
    lines.push(`- [ ] \`${r.loc}\``);
    lines.push(`  - EN: ${esc(clip(r.en))}`);
    lines.push(`  - ${L}: ${esc(clip(r.tr))}`);
  }
  lines.push("");

  lines.push(`## 2. Unchanged — verify or translate (${verify.length})`, "",
             `Still identical to English: either a proper noun that should stay, or a`,
             `string the MT pass skipped (timeout). Confirm or translate.`, "");
  for (const r of verify) {
    lines.push(`- [ ] \`${r.loc}\` — ${esc(clip(r.en, 160))}`);
  }
  lines.push("");

  lines.push(`## 3. Long-form left in English (${longform.length})`, "",
             `Bodies over ${MAX_LEN} chars were not machine-translated — they need human`,
             `long-form translation into ${NAME[lang]}.`, "");
  for (const r of longform) {
    lines.push(`- [ ] \`${r.loc}\` — ${esc(clip(r.en, 160))}`);
  }
  lines.push("");
  return lines.join("\n");
}

mkdirSync(OUT, { recursive: true });
const stats = [];
for (const lang of LANGS) {
  const data = buildLang(lang);
  writeFileSync(join(OUT, `${lang}.md`), render(lang, data));
  stats.push({ lang, ...data });
  console.log(`${lang}: review ${data.review.length} · verify ${data.verify.length} · long-form ${data.longform.length}`);
}

// index
const idx = ["# i18n native-review checklists", "",
  "Machine-translation first pass for commons-hub.at. Each language has a checklist;",
  "correct strings in the source files and re-run a build. UI strings live in",
  "`messages/<lang>.json`; content in `content/snapshot/<lang>/*.json`.", "",
  "| Language | To review | Unchanged (verify) | Long-form (EN) |",
  "|---|---:|---:|---:|",
  ...stats.map((s) => `| [${NAME[s.lang]}](${s.lang}.md) | ${s.review.length} | ${s.verify.length} | ${s.longform.length} |`),
  "",
  "**How to review:** open a language file, work top to bottom, tick each box once a",
  "native speaker confirms/corrects the text in the source file. Section 1 is MT to",
  "check; section 2 is strings still in English (skipped or proper nouns); section 3",
  "is long-form bodies needing human translation.", ""];
writeFileSync(join(OUT, "README.md"), idx.join("\n"));
console.log(`Wrote checklists -> ${OUT}`);
