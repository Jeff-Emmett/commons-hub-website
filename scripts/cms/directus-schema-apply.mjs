#!/usr/bin/env node
// Applies the commons-hub.at CMS schema to a Directus 11 instance.
//
// This script is the source of truth for everything the website needs in
// Directus beyond the original tables: the languages + translations model, the
// page sections that fill the hand-designed pages, site settings, UI strings,
// booking options, editor-facing field notes and folders, the Content Editor
// and Public permissions, the revalidation flow and the visual-editor settings.
// It is idempotent -- every step checks before it creates -- so it is safe to
// re-run, and it is how a fresh instance is brought to the same shape.
// docs/cms/directus-schema-snapshot.json is the full-instance snapshot taken
// after running it (GET /schema/snapshot), for `directus schema apply`.
//
// Usage (admin credentials required):
//   DIRECTUS_URL=http://commons-hub-directus:8055 DIRECTUS_TOKEN=<admin token> \
//   SITE_URL=https://commons-hub.at \
//   REVALIDATE_URL=http://commons-hub-web:3000/api/revalidate REVALIDATE_SECRET=<secret> \
//     node scripts/cms/directus-schema-apply.mjs
//
// SITE_URL feeds the visual editor; REVALIDATE_* the cache-purge flow. Both are
// skipped (with a warning) when unset, so a schema-only run is possible.

import { readFileSync } from 'node:fs';
import { api as rawApi, exists } from './directus-client.mjs';

const SPEC = JSON.parse(
  readFileSync(new URL('../../cms/translations.json', import.meta.url), 'utf8'),
);

const PUBLIC_POLICY = 'abf8a154-5b1c-4a46-ac9c-7300570f4f17'; // "$t:public_label"
const EDITOR_POLICY_NAME = 'Content Editor';

async function api(method, path, body) {
  try {
    return await rawApi(method, path, body);
  } catch (err) {
    if (/already exists|duplicate|has to be unique/i.test(err.message)) return { skipped: true };
    throw err;
  }
}

const log = (...a) => console.log(...a);

// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────

async function ensureCollection(collection, meta, fields, { pk = 'integer' } = {}) {
  if (await exists(`/collections/${collection}`)) {
    await api('PATCH', `/collections/${collection}`, { meta });
    log(`  collection ${collection}: exists (meta refreshed)`);
    return false;
  }
  const idField =
    pk === 'string'
      ? null
      : {
          field: 'id',
          type: 'integer',
          meta: { hidden: true, readonly: true, interface: 'input' },
          schema: { is_primary_key: true, has_auto_increment: true },
        };
  await api('POST', '/collections', {
    collection,
    meta,
    schema: {},
    fields: [...(idField ? [idField] : []), ...fields],
  });
  log(`  collection ${collection}: created`);
  return true;
}

/** A sidebar folder: a collection with no table, used only to group others. */
async function ensureFolder(collection, meta) {
  if (await exists(`/collections/${collection}`)) {
    await api('PATCH', `/collections/${collection}`, { meta });
    return;
  }
  await api('POST', '/collections', { collection, meta, schema: null });
  log(`  folder ${collection}: created`);
}

async function ensureField(collection, field, type, meta = {}, schema = {}) {
  if (await exists(`/fields/${collection}/${field}`)) {
    await api('PATCH', `/fields/${collection}/${field}`, { meta });
    return false;
  }
  await api('POST', `/fields/${collection}`, { field, type, meta, schema });
  log(`    field ${collection}.${field}: created`);
  return true;
}

/** Update only the editor-facing meta of a field that already exists. */
async function fieldMeta(collection, field, meta) {
  if (!(await exists(`/fields/${collection}/${field}`))) return;
  await api('PATCH', `/fields/${collection}/${field}`, { meta });
}

async function ensureFileField(collection, field, meta = {}) {
  const created = await ensureField(collection, field, 'uuid', {
    interface: 'file-image',
    special: ['file'],
    display: 'image',
    ...meta,
  });
  if (created) {
    await api('POST', '/relations', {
      collection,
      field,
      related_collection: 'directus_files',
      schema: { on_delete: 'SET NULL' },
    });
  }
}

/** child.fk -> parent, plus the o2m alias on the parent side (sorted). */
async function ensureO2M(parent, alias, child, fk, fkType, aliasMeta, fkMeta = {}) {
  await ensureField(child, fk, fkType, { hidden: true, interface: 'select-dropdown-m2o', ...fkMeta });
  const { data: rels } = await rawApi('GET', `/relations/${child}`);
  if (!rels.find((r) => r.field === fk)) {
    await api('POST', '/relations', {
      collection: child,
      field: fk,
      related_collection: parent,
      meta: { one_field: alias, sort_field: 'sort', one_deselect_action: 'delete' },
      schema: { on_delete: 'CASCADE' },
    });
    log(`    relation ${child}.${fk} -> ${parent}: created`);
  }
  await ensureField(parent, alias, 'alias', { interface: 'list-o2m', special: ['o2m'], ...aliasMeta }, null);
}

async function findOne(path, filter) {
  const qs = Object.entries(filter)
    .map(([k, v]) => `filter[${k}][_eq]=${encodeURIComponent(v)}`)
    .join('&');
  const { data } = await rawApi('GET', `${path}?${qs}&limit=1`);
  return data?.[0];
}

const choices = (pairs) => ({
  choices: pairs.map(([value, text]) => ({ value, text })),
});

const notice = (text, color = 'info') => ({
  interface: 'presentation-notice',
  options: { color, text },
  special: ['alias', 'no-data'],
  width: 'full',
});

async function ensureNotice(collection, field, text, sort, color) {
  await ensureField(collection, field, 'alias', { ...notice(text, color), sort }, null);
}

// ─────────────────────────────────────────────────────────────
// Languages + translations
// ─────────────────────────────────────────────────────────────

async function ensureLanguages() {
  log('languages');
  await ensureCollection(
    'languages',
    {
      icon: 'translate',
      note: 'The languages the site is translated into. English is the main text of every item; these are the extra languages offered in each item\'s "Translations" field.',
      display_template: '{{name}}',
      sort_field: 'sort',
    },
    [
      {
        field: 'code',
        type: 'string',
        meta: { interface: 'input', readonly: true, width: 'half', note: 'Language code used by the site (de, hu, cs, sk). Do not change.' },
        schema: { is_primary_key: true, length: 8 },
      },
      { field: 'name', type: 'string', meta: { interface: 'input', width: 'half' }, schema: {} },
      { field: 'sort', type: 'integer', meta: { hidden: true }, schema: {} },
    ],
    { pk: 'string' },
  );
  for (const [i, lang] of SPEC.languages.entries()) {
    if (await exists(`/items/languages/${lang.code}`)) continue;
    await api('POST', '/items/languages', { ...lang, sort: i + 1 });
    log(`    language ${lang.code}: created`);
  }
}

async function pkType(collection) {
  const { data } = await rawApi('GET', `/fields/${collection}/id`);
  return data.type; // integer | bigInteger | uuid
}

async function ensureTranslations(collection, fields) {
  const tcol = `${collection}_translations`;
  const fk = `${collection}_id`;
  const fkType = await pkType(collection);
  await ensureCollection(
    tcol,
    { hidden: true, icon: 'translate', note: `Translations of ${collection}.` },
    [
      { field: fk, type: fkType, meta: { hidden: true }, schema: {} },
      { field: 'languages_code', type: 'string', meta: { hidden: true }, schema: { length: 8 } },
    ],
  );
  for (const [field, iface] of Object.entries(fields)) {
    const type = iface === 'input' ? 'string' : 'text';
    const options = iface === 'input-rich-text-html' ? { toolbar: RICH_TOOLBAR } : undefined;
    await ensureField(tcol, field, type, {
      interface: iface,
      ...(options ? { options } : {}),
      note: 'Leave empty to show the English text.',
    });
  }

  const { data: rels } = await rawApi('GET', `/relations/${tcol}`);
  if (!rels.find((r) => r.field === 'languages_code')) {
    await api('POST', '/relations', {
      collection: tcol,
      field: 'languages_code',
      related_collection: 'languages',
      meta: { one_field: null, junction_field: fk, sort_field: null },
      schema: { on_delete: 'SET NULL' },
    });
  }
  if (!rels.find((r) => r.field === fk)) {
    await api('POST', '/relations', {
      collection: tcol,
      field: fk,
      related_collection: collection,
      meta: { one_field: 'translations', junction_field: 'languages_code', sort_field: null },
      schema: { on_delete: 'CASCADE' },
    });
  }
  await ensureField(
    collection,
    'translations',
    'alias',
    {
      interface: 'translations',
      special: ['translations'],
      options: { languageField: 'name', defaultLanguage: 'de', userLanguage: false },
      note: 'German, Hungarian, Czech and Slovak versions. Any field left empty falls back to the English text above.',
      width: 'full',
      sort: 900,
    },
    null,
  );
  log(`  translations ${collection}: ok (${Object.keys(fields).join(', ') || 'relations only'})`);
}

const RICH_TOOLBAR = [
  'bold', 'italic', 'underline', 'h2', 'h3', 'numlist', 'bullist', 'link', 'blockquote', 'removeformat', 'code',
];

// ─────────────────────────────────────────────────────────────
// New content collections
// ─────────────────────────────────────────────────────────────

const STATUS_FIELD = {
  field: 'status',
  type: 'string',
  meta: {
    interface: 'select-dropdown',
    display: 'labels',
    options: choices([['published', 'Visible'], ['hidden', 'Hidden']]),
    width: 'half',
    note: 'Hidden removes it from the website without deleting it.',
  },
  schema: { default_value: 'published' },
};
const SORT_FIELD = { field: 'sort', type: 'integer', meta: { hidden: true, interface: 'input' }, schema: {} };

async function ensurePageSections() {
  log('page_sections / section_items');
  await ensureCollection(
    'page_sections',
    {
      icon: 'view_agenda',
      note: 'The text, images and lists that fill each page of the website. Usually edited from inside a page (Pages → open a page → Sections).',
      display_template: '{{page.title}} · {{heading}}',
      sort_field: 'sort',
      archive_field: 'status',
      archive_value: 'hidden',
      unarchive_value: 'published',
      accountability: 'all',
    },
    [STATUS_FIELD, SORT_FIELD],
  );
  await ensureCollection(
    'section_items',
    {
      icon: 'list',
      hidden: true,
      note: 'The individual cards / rows / links inside a page section (rooms, partners, footer links, ...).',
      display_template: '{{title}}',
      sort_field: 'sort',
      archive_field: 'status',
      archive_value: 'hidden',
      unarchive_value: 'published',
    },
    [STATUS_FIELD, SORT_FIELD],
  );

  // pages.sections (o2m) <- page_sections.page
  await ensureO2M('pages', 'sections', 'page_sections', 'page', 'bigInteger', {
    options: { template: '{{heading}}{{nav_label}} · {{section_key}}', enableCreate: false, enableSelect: false },
    note: 'The blocks of this page, top to bottom. Click one to edit its text, image and list items. Drag to reorder where the page allows it.',
    sort: 50,
    width: 'full',
  });
  // page_sections.items (o2m) <- section_items.section
  await ensureO2M('page_sections', 'items', 'section_items', 'section', 'integer', {
    options: { template: '{{title}}', enableCreate: true, enableSelect: false },
    note: 'Cards / rows / links shown in this section. Add, remove, drag to reorder.',
    sort: 60,
    width: 'full',
  });

  const S = 'page_sections';
  await ensureField(S, 'section_key', 'string', {
    interface: 'input',
    readonly: true,
    width: 'half',
    sort: 1,
    note: 'Which slot of the page design this fills. Set by the developer — read-only on purpose.',
  });
  await ensureField(S, 'placement', 'string', {
    interface: 'input',
    readonly: true,
    width: 'full',
    sort: 2,
    note: 'Where on the website this appears.',
  });
  await ensureField(S, 'nav_label', 'string', {
    interface: 'input', width: 'half', sort: 10,
    note: 'Short label for the page\'s side navigation (where the page has one).',
  });
  await ensureField(S, 'heading', 'string', { interface: 'input', width: 'full', sort: 11 });
  await ensureField(S, 'text', 'text', {
    interface: 'input-multiline', width: 'full', sort: 12,
    note: 'Plain text. Simple HTML such as <em>…</em> or <strong>…</strong> is allowed.',
  });
  await ensureField(S, 'button_label', 'string', { interface: 'input', width: 'half', sort: 20 });
  await ensureField(S, 'button_link', 'string', {
    interface: 'input', width: 'half', sort: 21,
    note: 'A page on this site (/events, /about#contact) or a full https:// address.',
  });
  await ensureFileField(S, 'image', { width: 'half', sort: 30 });
  await ensureField(S, 'image_alt', 'string', {
    interface: 'input', width: 'half', sort: 31, note: 'Describes the image for screen readers and search engines.',
  });
  await ensureField(S, 'page', 'bigInteger', {
    interface: 'select-dropdown-m2o', options: { template: '{{title}}' }, width: 'half', sort: 3, readonly: true, hidden: false,
  });

  const I = 'section_items';
  await ensureField(I, 'title', 'string', { interface: 'input', width: 'full', sort: 10 });
  await ensureField(I, 'text', 'text', {
    interface: 'input-multiline', width: 'full', sort: 11,
    note: 'Simple HTML such as <em>…</em> is allowed.',
  });
  await ensureFileField(I, 'image', { width: 'half', sort: 20, note: 'Photo or logo. Leave empty where the design shows a placeholder.' });
  await ensureField(I, 'image_alt', 'string', { interface: 'input', width: 'half', sort: 21 });
  await ensureField(I, 'link', 'string', {
    interface: 'input', width: 'half', sort: 30,
    note: 'A page on this site (/accommodation) or a full https:// address. Leave empty for no link.',
  });
  await ensureField(I, 'link_label', 'string', { interface: 'input', width: 'half', sort: 31 });
  await ensureField(I, 'icon', 'string', {
    interface: 'select-dropdown', width: 'half', sort: 40,
    options: choices([
      ['group', 'Group / house'], ['globe', 'Globe'], ['mail', 'Mail'], ['document', 'Document'],
      ['calendar', 'Calendar'], ['link', 'Link'],
    ]),
    note: 'Only used by the Linktree page.',
  });
  await ensureField(I, 'is_download', 'boolean', {
    interface: 'boolean', width: 'half', sort: 41, note: 'Linktree: the link downloads a file (e.g. a PDF).',
  }, { default_value: false });
  await ensureField(I, 'anchor', 'string', {
    interface: 'input', width: 'half', sort: 42,
    note: 'Optional #anchor id so other pages can link straight to this item.',
  });
  await ensureField(I, 'hint', 'string', {
    interface: 'input', width: 'half', sort: 43,
    note: 'Placeholder caption shown while no image is set.',
  });
}

async function ensureSiteSettings() {
  log('site_settings');
  await ensureCollection(
    'site_settings',
    {
      icon: 'settings',
      singleton: true,
      note: 'Contact details, social links and the default search-engine text for the whole site.',
    },
    [],
  );
  const C = 'site_settings';
  await ensureNotice(C, 'notice_contact', 'Contact details — shown in the footer, the About page, the side bar and the header.', 1);
  await ensureField(C, 'site_name', 'string', { interface: 'input', width: 'half', sort: 2 });
  await ensureField(C, 'contact_email', 'string', { interface: 'input', width: 'half', sort: 3 });
  await ensureField(C, 'address', 'text', {
    interface: 'input-multiline', width: 'full', sort: 4,
    note: 'One line per row: street, postcode + town, country.',
  });
  await ensureNotice(C, 'notice_social', 'Social links — the icons in the header, the side bar and the Linktree page. Leave one empty to hide that icon.', 10);
  await ensureField(C, 'telegram_url', 'string', { interface: 'input', width: 'half', sort: 11 });
  await ensureField(C, 'x_url', 'string', { interface: 'input', width: 'half', sort: 12, note: 'X (Twitter)' });
  await ensureField(C, 'instagram_url', 'string', { interface: 'input', width: 'half', sort: 13 });
  await ensureField(C, 'youtube_url', 'string', { interface: 'input', width: 'half', sort: 14 });
  await ensureField(C, 'instagram_handle', 'string', {
    interface: 'input', width: 'half', sort: 15, note: 'Account shown in the Instagram section of the Blog page (without @).',
  });
  await ensureNotice(C, 'notice_seo', 'Search engines & link previews — used on every page that has no text of its own.', 20);
  await ensureField(C, 'seo_title_default', 'string', { interface: 'input', width: 'full', sort: 21, note: 'Browser-tab title of the home page.' });
  await ensureField(C, 'seo_title_suffix', 'string', {
    interface: 'input', width: 'half', sort: 22, note: 'Added after every page title, e.g. " | Commons Hub".',
  });
  await ensureField(C, 'seo_description', 'text', { interface: 'input-multiline', width: 'full', sort: 23 });
  await ensureField(C, 'og_title', 'string', { interface: 'input', width: 'half', sort: 24, note: 'Title of link previews (Facebook, Telegram, ...).' });
  await ensureField(C, 'og_description', 'text', { interface: 'input-multiline', width: 'full', sort: 25 });
  await ensureField(C, 'twitter_description', 'text', { interface: 'input-multiline', width: 'full', sort: 26 });
  await ensureFileField(C, 'og_image', { width: 'half', sort: 27, note: 'Picture of link previews. Empty = the Commons Hub logo.' });
  await ensureFileField(C, 'event_fallback_image', {
    width: 'half', sort: 28, note: 'Shown for an event that has no picture of its own.',
  });
}

async function ensureUiStrings() {
  log('ui_strings');
  await ensureCollection(
    'ui_strings',
    {
      icon: 'text_fields',
      note: 'Small texts used across the site: buttons, form labels, footer headings, messages. Change the English text here and the translations below.',
      display_template: '{{value}}',
      sort_field: 'sort',
      group: null,
    },
    [SORT_FIELD],
  );
  const C = 'ui_strings';
  await ensureField(C, 'key', 'string', {
    interface: 'input', readonly: true, width: 'half', sort: 1,
    note: 'Where the site uses this text. Set by the developer — read-only.',
  }, { is_unique: true });
  await ensureField(C, 'group', 'string', { interface: 'input', readonly: true, width: 'half', sort: 2 });
  await ensureField(C, 'value', 'text', { interface: 'input-multiline', width: 'full', sort: 3, note: 'English text.' });
  await ensureField(C, 'note', 'string', { interface: 'input', readonly: true, width: 'full', sort: 4 });
}

async function ensureBookingOptions() {
  log('booking_options');
  await ensureCollection(
    'booking_options',
    {
      icon: 'payments',
      note: 'Room types and event packages offered in the booking forms, with their prices. The price estimate in the form is calculated from these.',
      display_template: '{{label}} · {{price_excl_vat}} €',
      sort_field: 'sort',
    },
    [SORT_FIELD],
  );
  const C = 'booking_options';
  await ensureField(C, 'kind', 'string', {
    interface: 'select-dropdown', readonly: true, width: 'half', sort: 1,
    options: choices([['room', 'Room (Book your stay)'], ['event_package', 'Event package (Book event space)']]),
  });
  await ensureField(C, 'option_key', 'string', {
    interface: 'input', readonly: true, width: 'half', sort: 2,
    note: 'Internal code the booking system stores. Read-only.',
  });
  await ensureField(C, 'label', 'string', { interface: 'input', width: 'full', sort: 3 });
  await ensureField(C, 'includes', 'string', { interface: 'input', width: 'full', sort: 4, note: 'Event packages: which spaces are included.' });
  await ensureField(C, 'capacity', 'string', { interface: 'input', width: 'half', sort: 5, note: 'Event packages, e.g. "max. 30 guests".' });
  await ensureField(C, 'price_excl_vat', 'decimal', {
    interface: 'input', width: 'half', sort: 6,
    note: 'EUR excl. VAT. Rooms: per person per night. Event packages: per day. 0 = "let\'s talk".',
  }, { numeric_precision: 10, numeric_scale: 2 });
  await ensureField(C, 'city_tax_per_night', 'decimal', {
    interface: 'input', width: 'half', sort: 7, note: 'Rooms only: city tax per person per night (EUR).',
  }, { numeric_precision: 10, numeric_scale: 2 });
}

async function ensurePagesExtras() {
  log('pages extras');
  await ensureField('menu', 'label', 'string', {
    interface: 'input', width: 'half', sort: 3,
    note: 'Optional shorter text for the menu. Empty = the title of the page.',
  });
  await ensureField('pages', 'fixed_route', 'string', {
    interface: 'input', readonly: true, width: 'half', sort: 2,
    note: 'This page has its own design at this address; its Sections fill that design. Set by the developer.',
  });
}

// ─────────────────────────────────────────────────────────────
// Editor UX on the pre-existing collections
// ─────────────────────────────────────────────────────────────

async function polishExisting() {
  log('editor UX on existing collections');
  const rich = { interface: 'input-rich-text-html', options: { toolbar: RICH_TOOLBAR } };
  for (const c of ['pages', 'posts', 'eventpages', 'categories']) {
    await fieldMeta(c, 'title', { interface: 'input', width: 'full', sort: 1 });
    await fieldMeta(c, 'slug', {
      interface: 'input', width: 'half', sort: 3,
      note: 'Part of the web address (lower-case, dashes). Changing it breaks existing links.',
    });
    await fieldMeta(c, 'status', {
      interface: 'select-dropdown', width: 'half', sort: 4, display: 'labels',
      options: choices([['published', 'Published'], ['draft', 'Draft'], ['archived', 'Archived']]),
    });
    await fieldMeta(c, 'summary', { interface: 'input-multiline', width: 'full', sort: 10, note: 'Short intro shown under the title and on cards.' });
    await fieldMeta(c, 'body', { ...rich, width: 'full', sort: 20 });
    await fieldMeta(c, 'main_image', { width: 'half', sort: 30 });
    await fieldMeta(c, 'main_icon', { width: 'half', sort: 31 });
    await fieldMeta(c, 'seo_title_tag', { interface: 'input', width: 'half', sort: 40, note: 'Search-engine title. Empty = the title.' });
    await fieldMeta(c, 'seo_description', { interface: 'input-multiline', width: 'full', sort: 41, note: 'Search-engine description. Empty = the summary.' });
    for (const f of ['user_created', 'user_updated', 'date_created', 'date_updated']) {
      await fieldMeta(c, f, { hidden: true, readonly: true });
    }
  }
  for (const f of ['icon_filename', 'image_filename', 'icon_id', 'image_id']) await fieldMeta('pages', f, { hidden: true });
  await fieldMeta('pages', 'is_homepage', { hidden: true });
  await fieldMeta('pages', 'is_eventpage', { width: 'half', note: 'Shows the upcoming / past events grids.' });
  await fieldMeta('pages', 'is_team', { width: 'half', note: 'Shows the team members.' });
  await fieldMeta('pages', 'is_map', { width: 'half', note: 'Shows the address, map and train directions.' });
  await fieldMeta('eventpages', 'startdatetime', { width: 'half', sort: 5, note: 'Start date & time' });
  await fieldMeta('eventpages', 'enddatetime', { width: 'half', sort: 6, note: 'End date & time' });
  await fieldMeta('posts', 'valid_to', { hidden: true });

  // carousel_items.image was created as a text column holding file ids, so the
  // Studio showed a bare uuid instead of an image picker. Directus cannot change
  // a column type through its API: migrations/20261101_carousel_items_image_uuid.sql
  // converts it, and this then adds the file relation on top.
  const { data: imgField } = await rawApi('GET', '/fields/carousel_items/image');
  if (imgField.type === 'uuid') {
    const { data: rels } = await rawApi('GET', '/relations/carousel_items');
    if (!rels.find((r) => r.field === 'image')) {
      await api('POST', '/relations', {
        collection: 'carousel_items', field: 'image', related_collection: 'directus_files',
        schema: { on_delete: 'SET NULL' },
      });
    }
    await fieldMeta('carousel_items', 'image', {
      interface: 'file-image', special: ['file'], display: 'image', width: 'half', note: 'The slide photo.',
    });
  } else {
    log('  ! carousel_items.image is still text -- run migrations/20261101_carousel_items_image_uuid.sql, then re-run');
  }
  await fieldMeta('carousel_items', 'quote', { ...rich, width: 'full', note: 'Text shown over the slide (home page hero).' });
  await fieldMeta('carousel_items', 'image_url', { hidden: true });
  await fieldMeta('carousel_items', 'carousel_id', { hidden: true });
  await fieldMeta('carousels', 'title', {
    interface: 'input', width: 'full',
    note: 'Name. Starting the name with "gallery:" makes it a section of the Gallery page. "home_hero" is the home page slideshow — do not rename it.',
  });
  await fieldMeta('carousels', 'carousel_items', {
    interface: 'list-o2m', special: ['o2m'], options: { template: '{{image.$thumbnail}} {{quote}}' },
    note: 'Photos in this carousel / gallery. Drag to reorder.',
  });
  await fieldMeta('accordion_items', 'header', { interface: 'input', width: 'full' });
  await fieldMeta('accordion_items', 'content', { ...rich, width: 'full' });
  await fieldMeta('accordion_items', 'accordion_id', { hidden: true });
  await fieldMeta('accordions', 'name_not_used', { interface: 'input', note: 'Internal name, only shown here in the admin.' });
  await fieldMeta('accordions', 'accordion_items', {
    interface: 'list-o2m', special: ['o2m'], options: { template: '{{header}}' }, note: 'The fold-out rows. Drag to reorder.',
  });
  await fieldMeta('team_members', 'bio', { interface: 'input-multiline', width: 'full' });
  await fieldMeta('team_members', 'status', {
    interface: 'select-dropdown', width: 'half', options: choices([['published', 'Published'], ['draft', 'Draft']]),
  });
  await fieldMeta('menu', 'page_id', {
    interface: 'select-dropdown-m2o', options: { template: '{{title}}' }, width: 'half',
    note: 'The page this menu entry opens. The label is the page title.',
  });
  await fieldMeta('menu', 'menu_order', { width: 'half', note: 'Position in the header menu (1 = first).' });
  await fieldMeta('menu', 'position', { hidden: true });

  await api('PATCH', '/collections/menu', {
    meta: { icon: 'menu', note: 'The header menu. Each entry opens one page; its label is that page\'s title.', display_template: '{{page_id.title}}', sort_field: 'menu_order' },
  });
  await api('PATCH', '/collections/team_members', {
    meta: { icon: 'groups', note: 'Team shown on the About page.', display_template: '{{name}} · {{role}}', sort_field: 'sort' },
  });
  await api('PATCH', '/collections/pages', {
    meta: {
      icon: 'description',
      note: 'Every page of the website. Hand-designed pages (Home, Accommodation, …) are filled from their Sections; other pages are built from their text, carousels, accordions and categories.',
      display_template: '{{title}}',
      sort_field: 'sort',
    },
  });
  await api('PATCH', '/collections/carousels', { meta: { sort_field: null, display_template: '{{title}}' } });
}

/** Sidebar folders so an editor sees the website, not the database. */
async function ensureFolders() {
  log('folders');
  const folders = [
    ['website', { icon: 'web', note: 'Pages and what is on them.', sort: 1, collapse: 'open' }],
    ['blog_events', { icon: 'event_note', note: 'Blog posts, events and their categories.', sort: 2, collapse: 'open' }],
    ['blocks', { icon: 'widgets', note: 'Carousels, galleries, accordions and team — reusable blocks placed on pages.', sort: 3, collapse: 'open' }],
    ['settings_folder', { icon: 'tune', note: 'Site-wide settings, small texts, booking prices, menu and languages.', sort: 4, collapse: 'open' }],
    ['legacy', { icon: 'inventory_2', note: 'Data the website does not use (kept for reference). Admins only.', sort: 9, collapse: 'closed' }],
  ];
  for (const [name, meta] of folders) await ensureFolder(name, meta);
  // Folder display names come from translations on the collection meta.
  const names = {
    website: 'Website', blog_events: 'Blog & Events', blocks: 'Building blocks',
    settings_folder: 'Settings', legacy: 'Legacy (unused)',
  };
  for (const [c, n] of Object.entries(names)) {
    await api('PATCH', `/collections/${c}`, { meta: { translations: [{ language: 'en-US', translation: n }] } });
  }
  const place = {
    website: ['pages', 'page_sections'],
    blog_events: ['posts', 'eventpages', 'categories'],
    blocks: ['carousels', 'accordions', 'team_members'],
    settings_folder: ['site_settings', 'ui_strings', 'booking_options', 'menu', 'languages'],
    legacy: [
      'accommodation_offerings', 'accommodation_prices', 'addresses', 'beds', 'countries', 'identifications',
      'identities', 'locations', 'organisations', 'page_images', 'profilepages', 'profiles', 'progressbar',
      'public_profiles', 'role_permissions', 'room_ao', 'rooms', 'stake_links', 'subscribers', 'user_roles',
    ],
  };
  for (const [group, cols] of Object.entries(place)) {
    for (const [i, c] of cols.entries()) {
      if (await exists(`/collections/${c}`)) {
        await api('PATCH', `/collections/${c}`, { meta: { group, sort: i + 1 } });
      }
    }
  }
  const labels = {
    page_sections: 'Page sections', site_settings: 'Site settings', ui_strings: 'Small texts (buttons, labels)',
    booking_options: 'Booking prices', eventpages: 'Events', team_members: 'Team', menu: 'Header menu',
  };
  for (const [c, n] of Object.entries(labels)) {
    await api('PATCH', `/collections/${c}`, { meta: { translations: [{ language: 'en-US', translation: n }] } });
  }
}

// ─────────────────────────────────────────────────────────────
// Permissions
// ─────────────────────────────────────────────────────────────

async function grant(policy, collection, action, { fields = ['*'], permissions = {}, validation = null } = {}) {
  const { data: current } = await rawApi(
    'GET',
    `/permissions?filter[policy][_eq]=${policy}&filter[collection][_eq]=${collection}&filter[action][_eq]=${action}&limit=1`,
  );
  if (current.length) {
    await api('PATCH', `/permissions/${current[0].id}`, { fields, permissions, validation });
    return;
  }
  await api('POST', '/permissions', { policy, collection, action, fields, permissions, validation });
  log(`    permission ${collection}/${action}: created`);
}

async function revoke(policy, collection, action) {
  const { data: current } = await rawApi(
    'GET',
    `/permissions?filter[policy][_eq]=${policy}&filter[collection][_eq]=${collection}&filter[action][_eq]=${action}&limit=-1`,
  );
  for (const p of current) {
    await api('DELETE', `/permissions/${p.id}`);
    log(`    permission ${collection}/${action}: revoked`);
  }
}

const TRANSLATED = Object.keys(SPEC.collections);
const T = (c) => `${c}_translations`;

async function ensurePublicPermissions() {
  log('public permissions');
  const visible = { status: { _eq: 'published' } };
  await grant(PUBLIC_POLICY, 'page_sections', 'read', { permissions: visible });
  await grant(PUBLIC_POLICY, 'section_items', 'read', { permissions: visible });
  for (const c of ['site_settings', 'ui_strings', 'booking_options', 'languages']) await grant(PUBLIC_POLICY, c, 'read');
  for (const c of TRANSLATED) {
    if (await exists(`/collections/${T(c)}`)) await grant(PUBLIC_POLICY, T(c), 'read');
  }
}

/**
 * The public role historically read EVERY table, including ones holding
 * personal data the website never shows (subscribers, profiles, identities,
 * addresses ...). Only run with --lock-public; on production this changes who
 * can read what, so it needs the owner's go-ahead.
 */
async function lockPublicPermissions() {
  log('public permissions: lock down tables the site does not read');
  for (const c of [
    'addresses', 'identifications', 'identities', 'organisations', 'profiles', 'public_profiles',
    'role_permissions', 'subscribers', 'user_roles', 'stake_links', 'profilepages', 'progressbar', 'page_images',
  ]) {
    await revoke(PUBLIC_POLICY, c, 'read');
  }
}

const EDITOR_CONTENT = [
  'pages', 'page_sections', 'section_items', 'posts', 'eventpages', 'categories', 'carousels', 'carousel_items',
  'accordions', 'accordion_items', 'team_members', 'menu',
  'page_carousel', 'page_accordion', 'page_category', 'page_post', 'category_post', 'category_carousel',
  'category_accordion', 'post_accordion', 'post_carousel',
];

async function ensureEditorPermissions() {
  log('Content Editor permissions');
  const policy = await findOne('/policies', { name: EDITOR_POLICY_NAME });
  if (!policy) {
    log('  Content Editor policy not found, skipping');
    return;
  }
  const P = policy.id;
  // A section is a slot in a page design: the editor fills it, hides it
  // (status) and edits its items, but cannot add or delete slots or re-point
  // one at another slot or page.
  await grant(P, 'page_sections', 'read');
  await grant(P, 'page_sections', 'update', {
    fields: ['status', 'nav_label', 'heading', 'text', 'button_label', 'button_link', 'image', 'image_alt', 'items', 'translations', 'sort'],
  });
  await revoke(P, 'page_sections', 'create');
  await revoke(P, 'page_sections', 'delete');
  for (const c of EDITOR_CONTENT.filter((x) => x !== 'page_sections')) {
    for (const a of ['create', 'read', 'update']) await grant(P, c, a);
    // A hand-designed page cannot be deleted from the admin: its design lives in
    // code, and deleting the row would only orphan it. Everything else can.
    await grant(P, c, 'delete', c === 'pages' ? { permissions: { fixed_route: { _null: true } } } : {});
  }
  for (const c of TRANSLATED) {
    if (!(await exists(`/collections/${T(c)}`))) continue;
    for (const a of ['create', 'read', 'update', 'delete']) await grant(P, T(c), a);
  }
  for (const c of ['site_settings', 'ui_strings', 'booking_options']) {
    await grant(P, c, 'read');
    const fields = {
      booking_options: ['label', 'includes', 'capacity', 'price_excl_vat', 'city_tax_per_night', 'sort', 'translations'],
      ui_strings: ['value', 'translations'],
    }[c];
    await grant(P, c, 'update', fields ? { fields } : {});
  }
  await grant(P, 'languages', 'read');
  for (const a of ['create', 'read', 'update']) await grant(P, 'directus_files', a);
  await grant(P, 'directus_folders', 'read');
  // Lets the editor see who changed what (Activity / revisions sidebar).
  await grant(P, 'directus_revisions', 'read');
}

// ─────────────────────────────────────────────────────────────
// Revalidation flow + visual editor
// ─────────────────────────────────────────────────────────────

const FLOW_NAME = 'Refresh website on content change';

async function ensureRevalidateFlow() {
  log('revalidate flow');
  const url = process.env.REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) {
    log('  REVALIDATE_URL / REVALIDATE_SECRET unset -- skipping (edits will show within 60 s instead of instantly)');
    return;
  }
  const watched = [
    ...EDITOR_CONTENT, 'site_settings', 'ui_strings', 'booking_options', 'languages', 'directus_files',
    ...TRANSLATED.map(T),
  ];
  const options = { type: 'action', scope: ['items.create', 'items.update', 'items.delete'], collections: watched };
  let flow = await findOne('/flows', { name: FLOW_NAME });
  if (!flow) {
    const { data } = await rawApi('POST', '/flows', {
      name: FLOW_NAME,
      icon: 'refresh',
      color: '#2ECDA7',
      description: 'Tells commons-hub.at to drop its content cache whenever anything on the website is edited.',
      status: 'active',
      trigger: 'event',
      accountability: null,
      options,
    });
    flow = data;
    log('  flow created');
  } else {
    await api('PATCH', `/flows/${flow.id}`, { options, status: 'active', trigger: 'event' });
  }
  const opBody = {
    flow: flow.id,
    key: 'revalidate',
    name: 'POST /api/revalidate',
    type: 'request',
    position_x: 19,
    position_y: 1,
    options: { method: 'POST', url, headers: [{ header: 'x-revalidate-secret', value: secret }], body: '{}' },
  };
  const op = await findOne('/operations', { flow: flow.id, key: 'revalidate' });
  if (op) await api('PATCH', `/operations/${op.id}`, opBody);
  else {
    const { data } = await rawApi('POST', '/operations', opBody);
    await rawApi('PATCH', `/flows/${flow.id}`, { operation: data.id });
  }
  log(`  flow watches ${watched.length} collections -> ${url}`);
}

async function ensureSettings() {
  log('project settings');
  const site = process.env.SITE_URL;
  const patch = { project_name: 'Commons Hub', project_descriptor: 'Website content' };
  if (site) patch.visual_editor_urls = [{ name: 'commons-hub.at', url: site }];
  await api('PATCH', '/settings', patch);
}

async function main() {
  const lockPublic = process.argv.includes('--lock-public');
  await ensureLanguages();
  await ensurePagesExtras();
  await ensurePageSections();
  await ensureSiteSettings();
  await ensureUiStrings();
  await ensureBookingOptions();
  for (const [c, def] of Object.entries(SPEC.collections)) {
    if (Object.keys(def.fields).length) await ensureTranslations(c, def.fields);
  }
  await polishExisting();
  await ensureFolders();
  await ensurePublicPermissions();
  if (lockPublic) await lockPublicPermissions();
  await ensureEditorPermissions();
  await ensureRevalidateFlow();
  await ensureSettings();
  log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
