#!/usr/bin/env node
// Moves the website's content into Directus. Run AFTER directus-schema-apply.mjs.
//
//   1. pages: fixed_route on the hand-designed pages, new rows for the ones that
//      had none, their SEO text.
//   2. page_sections + section_items from scripts/cms/seed-content.mjs (the copy
//      that was hardcoded in the page components).
//   3. site_settings, ui_strings (messages/*.json + strings that were hardcoded),
//      booking_options.
//   4. Translations: content/snapshot/<locale>/*.json held the machine-translated
//      DE/HU/CS/SK copy the live site served; each translated field that differs
//      from English becomes a Directus translation row.
//   5. English content that was edited in the snapshot after Directus was
//      switched off (one post) is copied back into Directus.
//
// Idempotent and NON-DESTRUCTIVE: a section, item, string or translation is only
// written when it does not exist yet, so re-running never overwrites an edit
// made in Directus. --dry-run prints what would be written.
//
//   DIRECTUS_URL=... DIRECTUS_TOKEN=<admin> node scripts/cms/directus-migrate-content.mjs

import { readFileSync, existsSync } from 'node:fs';
import { api, getAll } from './directus-client.mjs';
import {
  PAGES, SITE_SETTINGS, KEYS_MOVED_TO_SECTIONS, UI_STRING_NOTES, BOOKING_OPTIONS, UNWIRED_TRANSLATIONS,
} from './seed-content.mjs';

const ROOT = new URL('../../', import.meta.url);
const DRY = process.argv.includes('--dry-run');
const WITH_BOOKING_TRANSLATIONS = process.argv.includes('--with-booking-translations');
const SPEC = JSON.parse(readFileSync(new URL('cms/translations.json', ROOT), 'utf8'));
const LOCALES = SPEC.languages.map((l) => l.code);

const json = (rel) => JSON.parse(readFileSync(new URL(rel, ROOT), 'utf8'));
const messages = Object.fromEntries(['en', ...LOCALES].map((l) => [l, json(`messages/${l}.json`)]));
const msg = (locale, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), messages[locale]);

let writes = 0;
async function write(method, path, body, what) {
  writes++;
  console.log(`  ${DRY ? '[dry] ' : ''}${what}`);
  if (DRY) return { data: { id: `dry-${writes}` } };
  return api(method, path, body);
}

const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));

// ─────────────────────────────────────────────────────────────
// Translations helpers
// ─────────────────────────────────────────────────────────────

const existingTr = new Map(); // `${collection}:${id}:${lang}` -> row

async function loadTranslations(collection) {
  const fk = `${collection}_id`;
  for (const r of await getAll(`${collection}_translations`, `fields=id,${fk},languages_code`)) {
    existingTr.set(`${collection}:${r[fk]}:${r.languages_code}`, r);
  }
}

/** Add a translation row unless that item already has one in that language. */
async function addTranslation(collection, id, lang, fields) {
  const clean = Object.fromEntries(Object.entries(fields).filter(([, v]) => typeof v === 'string' && v.trim() !== ''));
  if (!Object.keys(clean).length) return;
  const key = `${collection}:${id}:${lang}`;
  if (existingTr.has(key)) return;
  existingTr.set(key, true);
  await write(
    'POST',
    `/items/${collection}_translations`,
    { [`${collection}_id`]: id, languages_code: lang, ...clean },
    `translation ${collection}#${id} [${lang}] ${Object.keys(clean).join(',')}`,
  );
}

/** Translations for a seed entry whose fields reference message-catalog keys. */
async function addI18nTranslations(collection, id, entry, fieldsSpec) {
  if (!entry.i18n) return;
  for (const lang of LOCALES) {
    const fields = {};
    for (const [field, key] of Object.entries(entry.i18n)) {
      if (!(field in fieldsSpec)) continue;
      const en = msg('en', key);
      if (en !== entry[field]) throw new Error(`seed ${collection}.${field} "${entry[field]}" != messages/en ${key} "${en}"`);
      const tr = msg(lang, key);
      if (tr && tr !== en) fields[field] = tr;
    }
    await addTranslation(collection, id, lang, fields);
  }
}

// ─────────────────────────────────────────────────────────────
// 1 + 2. Pages and sections
// ─────────────────────────────────────────────────────────────

const SECTION_FIELDS = ['nav_label', 'heading', 'text', 'button_label', 'button_link', 'image', 'image_alt'];
const ITEM_FIELDS = ['title', 'text', 'image', 'image_alt', 'link', 'link_label', 'icon', 'is_download', 'anchor', 'hint'];

async function migratePages() {
  console.log('pages + sections');
  const pages = await getAll('pages', 'fields=id,slug,fixed_route,seo_title_tag,seo_description');
  const sections = await getAll('page_sections', 'fields=id,page,section_key');
  const items = await getAll('section_items', 'fields=id,section');
  const maxSort = pages.reduce((m, p) => Math.max(m, p.sort ?? 0), 0);

  for (const [pi, def] of PAGES.entries()) {
    let page = def.id ? pages.find((p) => String(p.id) === String(def.id)) : pages.find((p) => p.slug === def.slug);
    if (def.id && (!page || page.slug !== def.slug)) throw new Error(`pages#${def.id} is not "${def.slug}"`);
    if (!page) {
      const { data } = await write('POST', '/items/pages', {
        slug: def.slug, title: def.title, status: 'published', fixed_route: def.fixed_route,
        sort: maxSort + pi + 1, ...(def.seo ?? {}),
      }, `page "${def.slug}" created`);
      page = { id: data.id, slug: def.slug };
    } else {
      const patch = {};
      if (page.fixed_route !== def.fixed_route) patch.fixed_route = def.fixed_route;
      // The fixed pages never used their pages-row SEO text (their metadata was
      // hardcoded), so whatever is in the row was never live: overwrite it with
      // what the live site actually serves.
      if (def.seo && !page.fixed_route) Object.assign(patch, def.seo);
      if (Object.keys(patch).length) await write('PATCH', `/items/pages/${page.id}`, patch, `page "${def.slug}" ${Object.keys(patch).join(',')}`);
    }

    for (const [si, s] of def.sections.entries()) {
      let row = sections.find((x) => String(x.page) === String(page.id) && x.section_key === s.key);
      if (row) continue; // never overwrite an existing section (or its items)
      const { data } = await write('POST', '/items/page_sections', {
        page: page.id, section_key: s.key, placement: s.placement, status: 'published', sort: si + 1,
        ...pick(s, SECTION_FIELDS),
      }, `section ${def.slug}/${s.key}`);
      row = { id: data.id };
      await addI18nTranslations('page_sections', row.id, s, SPEC.collections.page_sections.fields);
      for (const [ii, it] of (s.items ?? []).entries()) {
        if (items.find((x) => String(x.section) === String(row.id))) break;
        const { data: item } = await write('POST', '/items/section_items', {
          section: row.id, status: 'published', sort: ii + 1, ...pick(it, ITEM_FIELDS),
        }, `  item ${def.slug}/${s.key}/${it.title ?? ii}`);
        await addI18nTranslations('section_items', item.id, it, SPEC.collections.section_items.fields);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 3. Settings, UI strings, booking options
// ─────────────────────────────────────────────────────────────

// The header used to override one label in code (HEADER_LABEL_OVERRIDES).
const MENU_LABELS = { venue: 'VENUE' };

async function migrateMenu() {
  console.log('menu labels');
  for (const m of await getAll('menu', 'fields=id,label,page_id.slug')) {
    const label = MENU_LABELS[m.page_id?.slug];
    if (label && !m.label) await write('PATCH', `/items/menu/${m.id}`, { label }, `menu #${m.id} label "${label}"`);
  }
}

async function migrateSettings() {
  console.log('site_settings');
  const { data: current } = await api('GET', '/items/site_settings');
  const missing = Object.fromEntries(
    Object.entries(SITE_SETTINGS).filter(([k, v]) => v != null && (current?.[k] == null || current[k] === '')),
  );
  if (Object.keys(missing).length) await write('PATCH', '/items/site_settings', missing, `site_settings ${Object.keys(missing).join(',')}`);
}

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    if (k === '_meta') return [];
    const key = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === 'object' ? flatten(v, key) : [[key, v]];
  });
}

async function migrateUiStrings() {
  console.log('ui_strings');
  const have = new Map((await getAll('ui_strings', 'fields=id,key,note')).map((r) => [r.key, r]));
  let sort = have.size;
  for (const [key, value] of flatten(messages.en)) {
    if (KEYS_MOVED_TO_SECTIONS.has(key)) continue;
    const note = UI_STRING_NOTES[key] ?? UI_STRING_NOTES[key.split('.')[0]] ?? null;
    let row = have.get(key);
    if (!row) {
      const { data } = await write('POST', '/items/ui_strings', {
        key, value, group: key.split('.')[0], note, sort: ++sort,
      }, `ui_string ${key}`);
      row = data;
    } else if (!row.note && note) {
      await write('PATCH', `/items/ui_strings/${row.id}`, { note }, `ui_string ${key} note`);
    }
    if (UNWIRED_TRANSLATIONS.has(key) && !WITH_BOOKING_TRANSLATIONS) continue;
    for (const lang of LOCALES) {
      const tr = msg(lang, key);
      if (tr && tr !== value) await addTranslation('ui_strings', row.id, lang, { value: tr });
    }
  }
}

async function migrateBookingOptions() {
  console.log('booking_options');
  const have = await getAll('booking_options', 'fields=id,kind,option_key');
  for (const [i, o] of BOOKING_OPTIONS.entries()) {
    if (have.find((h) => h.kind === o.kind && h.option_key === o.option_key)) continue;
    await write('POST', '/items/booking_options', { ...o, sort: i + 1 }, `booking_option ${o.kind}/${o.option_key}`);
  }
}

// ─────────────────────────────────────────────────────────────
// 4 + 5. Snapshot translations and English drift
// ─────────────────────────────────────────────────────────────

const SNAPSHOT_SOURCES = {
  pages: { file: 'pages' },
  posts: { file: 'posts' },
  eventpages: { file: 'eventpages' },
  categories: { file: 'categories' },
  carousels: { file: 'carousels', nested: { carousel_items: 'carousel_items' } },
  accordions: { file: 'accordions', nested: { accordion_items: 'accordion_items' } },
  team_members: { file: 'team_members' },
};

function snapshot(locale, file) {
  const p = new URL(`content/snapshot/${locale}/${file}.json`, ROOT);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : [];
}

/** Collect {collection -> id -> row} from a snapshot file, including nested rows. */
function rowsOf(locale) {
  const out = {};
  const add = (c, r) => ((out[c] ??= new Map()).set(String(r.id), r));
  for (const [c, src] of Object.entries(SNAPSHOT_SOURCES)) {
    for (const r of snapshot(locale, src.file)) {
      add(c, r);
      for (const [rel, child] of Object.entries(src.nested ?? {})) {
        for (const n of Array.isArray(r[rel]) ? r[rel] : []) if (n && typeof n === 'object') add(child, n);
      }
    }
  }
  return out;
}

async function migrateSnapshotTranslations() {
  console.log('snapshot translations');
  const en = rowsOf('en');
  for (const lang of LOCALES) {
    const loc = rowsOf(lang);
    for (const [c, rows] of Object.entries(loc)) {
      const fields = Object.keys(SPEC.collections[c]?.fields ?? {});
      if (!fields.length) continue;
      for (const [id, r] of rows) {
        const base = en[c]?.get(id);
        if (!base) continue;
        const tr = {};
        for (const f of fields) if (r[f] && r[f] !== base[f]) tr[f] = r[f];
        await addTranslation(c, Number(id), lang, tr);
      }
    }
  }
}

// Diffing every content field of content/snapshot/en against Directus on
// 2026-11-01 found exactly one item that was edited in the snapshot after
// Directus was switched off (commit 81f5a72, "publish The Resurgence of the
// Commons over the placeholder post"): Directus still holds the Lorem-ipsum
// placeholder. Listed explicitly so nothing else is ever overwritten.
const ENGLISH_DRIFT = { posts: { 93: ['title', 'summary', 'body', 'seo_title_tag', 'seo_description', 'main_image'] } };

async function migrateEnglishDrift() {
  console.log('english drift (snapshot edits made while Directus was switched off)');
  const en = rowsOf('en');
  for (const [c, byId] of Object.entries(ENGLISH_DRIFT)) {
    for (const [id, fields] of Object.entries(byId)) {
      const snap = en[c]?.get(id);
      const { data: cur } = await api('GET', `/items/${c}/${id}?fields=${fields.join(',')}`);
      // Once the placeholder is gone the item is the editor's: never overwrite it again.
      if (!/lorem ipsum/i.test(cur.body ?? '')) continue;
      const patch = Object.fromEntries(fields.filter((f) => snap?.[f] != null && snap[f] !== cur[f]).map((f) => [f, snap[f]]));
      if (Object.keys(patch).length) await write('PATCH', `/items/${c}/${id}`, patch, `${c}#${id} <- snapshot ${Object.keys(patch).join(',')}`);
    }
  }
}

async function main() {
  for (const c of Object.keys(SPEC.collections)) {
    if (Object.keys(SPEC.collections[c].fields).length) await loadTranslations(c);
  }
  await migratePages();
  await migrateMenu();
  await migrateSettings();
  await migrateUiStrings();
  await migrateBookingOptions();
  await migrateEnglishDrift();
  await migrateSnapshotTranslations();
  console.log(`${DRY ? 'would write' : 'wrote'} ${writes} change(s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
