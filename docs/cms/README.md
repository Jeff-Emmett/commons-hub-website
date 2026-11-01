# Directus CMS — how the site is wired

All visible content of commons-hub.at lives in Directus (`admin.commons-hub.at`,
Directus 11). Nothing on the public site needs a code change to edit. The
pattern follows xhiva.art (keyed page sections, a revalidation flow, the
Directus Visual Editor), extended with native Directus translations because
this site is multilingual. Editor-facing guide: [EDITOR-GUIDE.md](EDITOR-GUIDE.md).

## Data model

| Collection | Holds | Read by |
|---|---|---|
| `pages` (+ `sections` o2m) | Every page. Hand-designed routes have `fixed_route` set and are filled from their sections; other pages render through `/page/[slug]` from body/carousels/accordions/categories (unchanged). | `lib/cms/content.ts` `getPageContent()`, `lib/actions/getPage.tsx` |
| `page_sections` (+ `items` o2m) | One block of a hand-designed page: `section_key` (the slot, read-only), nav label, heading, text, button, image. | page components under `app/` |
| `section_items` | Cards/rows/links inside a section (rooms, partners, footer links, linktree buttons…). | same |
| `site_settings` (singleton) | Contact email, address, social URLs, Instagram handle, SEO/OG defaults, event fallback image. | `app/layout.tsx`, `SiteChrome` context |
| `ui_strings` | Every small UI text (buttons, form labels, validation, empty states), keyed like the next-intl catalog. | `i18n/request.ts` (overlays `messages/*.json`) |
| `booking_options` | Room types and event packages with prices. Keys are fixed (the inquiry API validates them). | `components/bookings/BookingForm.tsx` |
| `languages` + `<collection>_translations` | DE/HU/CS/SK. English is the item's own fields; a translation row overrides only the fields that are filled. Which collections/fields: `cms/translations.json`. | `lib/directus/translations.ts` |
| `posts`, `eventpages`, `categories`, `carousels`(+items), `accordions`(+items), `team_members`, `menu` | Pre-existing content collections, now with translations and editor notes. `menu.label` overrides the page title in the header. | `lib/actions/*` |

Section keys per page are listed in `scripts/cms/seed-content.mjs` (the
original copy, with a *placement* note that the editor sees).

## Read path

`lib/directus/client.ts` → every public read

1. widens the query with `translations.*` for the active locale (also for nested
   relations listed in `cms/translations.json`) and folds the translation rows
   back into the English shape — callers never see `translations`;
2. is cached by Next under the tag `directus-content` for 60 s;
3. falls back to `content/snapshot/<locale>/` if Directus is unreachable
   (`USE_STATIC_CONTENT=true` forces the snapshot; emergency switch).

Authenticated reads (the legacy in-app `/admin`) bypass all three.

## Edits reaching the site

Directus flow **"Refresh website on content change"** (event hook on create/
update/delete of every website collection, translations and files) POSTs
`/api/revalidate` with `x-revalidate-secret`, which purges the tag. The app
needs `REVALIDATE_SECRET`; the flow gets the same value from the schema script.
If the flow is down, edits still appear within 60 s.

The Visual Editor (`components/VisualEditing.tsx`) loads only inside the
Directus iframe; elements carry `data-directus` via `sectionEdit()` /
`itemEdit()` / `editAttr()`. Directus needs `CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC`
to include the site origin, and `settings.visual_editor_urls` the site URL.

## Scripts (all idempotent)

```bash
# 0. one-time SQL fixes (column types / id defaults); restart Directus after
docker exec -i commons-hub-directus-db psql -U postgres -d directus < migrations/20261101_carousel_items_image_uuid.sql
docker exec -i commons-hub-directus-db psql -U postgres -d directus < migrations/20261101_id_sequences.sql
# 1. schema, permissions, flow, settings (admin token)
DIRECTUS_URL=… DIRECTUS_TOKEN=… SITE_URL=https://commons-hub.at \
REVALIDATE_URL=http://commons-hub-web:3000/api/revalidate REVALIDATE_SECRET=… \
  node scripts/cms/directus-schema-apply.mjs            # add --lock-public, see below
# 2. content (never overwrites an existing section/item/string/translation)
DIRECTUS_URL=… DIRECTUS_TOKEN=… node scripts/cms/directus-migrate-content.mjs [--dry-run]
# 3. refresh the offline fallback
DIRECTUS_CAPTURE_URL=https://admin.commons-hub.at node scripts/capture-directus.mjs
```

`docs/cms/directus-schema-snapshot.json` is `GET /schema/snapshot` after these
ran — the full schema, for `npx directus schema apply` on a fresh instance.

`--lock-public` revokes public read on tables the site never shows but that
historically were world-readable (subscribers, profiles, identities, …).

## Roles

- **Administrator** — everything.
- **Content Editor** (policy) — create/read/update/delete on all website
  content and translations; update-only on site settings, small texts and
  booking prices (labels/prices, not keys); can't delete a page that has a
  `fixed_route`; files: upload/edit, no delete; no schema, settings, users,
  bookings or legacy tables. Revision history readable (for undo).
