# Internationalisation plan (DE / HU / CS / SK + regional)

## Goal

Serve commons-hub.at in English (default), German, Hungarian, Czech, Slovak —
extensible to Slovenian / Polish / Croatian / Italian later. Approach:
**next-intl with locale routing + machine-translation first pass, every
non-English string flagged for native-speaker review.**

## Key fact that shapes the work

The site is **Directus-driven**. Pages are thin server components that fetch
content (hero quotes, team bios, menu/nav labels, posts, events, page bodies)
from Directus at `admin.commons-hub.at`. So user-facing text splits in two:

| Bucket | Where | Share of visible text | Needs |
|---|---|---|---|
| **UI chrome** | hardcoded in components (footer, forms, buttons, a few headings) | ~20% | in-repo only ✅ done in Phase 1 |
| **Content** | Directus (`menu`, `pages`, `posts`, `events`, `carousels`, `team`, …) | ~80% | Directus **read = public** (have it), **write = admin token** ❌ |

A UI-strings-only translation would leave the site visibly half-translated
(German chrome, English nav + pages). The bulk lives in Directus.

## Phase 1 — Foundation (DONE, this branch, additive/inert)

- `i18n/routing.ts` — locales `["en","de","hu","cs","sk"]`, default `en`,
  `localePrefix: "as-needed"` (English URLs unchanged; others under `/de` etc.)
- `i18n/request.ts` — per-request catalog loader
- `messages/{en,de,hu,cs,sk}.json` — UI chrome strings; non-`en` carry
  `_meta.needsReview: true`
- `components/LanguageSwitcher.tsx` — locale dropdown (native names)
- next-intl added to dependencies

Nothing here is wired into the running app yet, so the live site is unchanged.

## Phase 2 — Wire the routing (prod-affecting; verify `next build`)

1. Add the next-intl plugin in `next.config.ts`.
2. Move routes under `app/[locale]/…` (keep `app/api/…` and `app/admin/…` as-is).
3. Compose next-intl middleware with the **existing** `middleware.ts` auth logic
   (do not clobber it).
4. Wrap the locale layout in `NextIntlClientProvider`; `setRequestLocale` in pages.
5. Replace hardcoded chrome strings with `t()` (footer, BookingForm,
   NewsletterSignup, auth pages, common buttons) — keys already in the catalogs.
6. Mount `<LanguageSwitcher/>` in `Header2`.
7. Verify build + smoke-test each locale before fast-forwarding `main`.

## Phase 3 — Directus content i18n (the 80%; needs admin token)

**Decision required — two viable approaches:**

- **A. Native Directus translations (recommended, durable).** Add a `languages`
  collection + `*_translations` relations on translatable collections
  (`pages`, `posts`, `events`, `menu`, `carousels`, `team`). Update the fetch
  layer (`lib/directus/client.ts`, `lib/actions/*`) to request the active locale
  via `deep`/translations. Editors manage translations in Directus going forward.
  **Needs:** Directus admin token + schema migration on production.

- **B. Static MT snapshot (fast, no token, goes stale).** Read all content
  (public read works today), machine-translate it, bundle per-locale JSON in the
  repo. Unblocks immediately, but content edits in Directus won't propagate until
  re-run. Good for a launch; not a long-term home.

Either way the MT pass is first-draft only — route every translated field through
native-speaker review before it is treated as final.

## Adding a language later

Add the code to `i18n/routing.ts`, add `messages/<code>.json`, add a label in
`LanguageSwitcher`, and (Phase 3) translate the Directus content for it. No other
changes required.

## Phase 2b — Language UX (done)

- **Switcher** (`components/LanguageSwitcher.tsx`) is a real dropdown, not a
  bare `<select>`: globe + locale code trigger, native name over English name,
  check mark on the active language, keyboard/ARIA behaviour from Radix. Two
  variants — `header` (desktop) and `menu` (mobile drawer, where the popover
  would be awkward). It is now mounted in **both** places.
- **Auto-detection** (`lib/i18n/geo.ts` + `middleware.ts`): a visitor with no
  `NEXT_LOCALE` cookie gets a language from **geo-IP** (`cf-ipcountry`, which
  Cloudflare sets in front of commons-hub.at; `x-vercel-ip-country` /
  `x-geo-country` as fallbacks), then from `Accept-Language`, then English.
  AT/DE/CH/LI/LU → `de`, HU → `hu`, CZ → `cs`, SK → `sk`.
  The middleware writes the locale onto the *request* as well as the response
  cookie, so the very first page render is already translated. An explicit pick
  in the switcher always wins — detection only runs when the cookie is absent,
  and `NEXT_LOCALE_SOURCE` records which of the two chose it (shown as a
  one-line note at the bottom of the dropdown when it was a guess).

## Hazard: translated lookup keys

Some snapshot `title` values are **machine keys the code queries verbatim** —
`app/page.tsx` filters carousels on `title == "home_hero"`, `getGalleryCarousels()`
on `title` starting with `"gallery"`. The first MT pass translated them
(`home_hero` → `startseite_held`, `gallery: …` → `Galerie: …`), so those queries
matched nothing and the **homepage hero and the entire gallery silently vanished
in DE/HU/CS/SK** — the pages still rendered, just without those sections.

Guards now in place:
- `scripts/translate-snapshot.mjs` never translates snake_case identifiers and
  preserves a `gallery:` prefix, translating only the prose after it.
- `scripts/repair-snapshot-keys.mjs` fixes snapshots produced before that guard
  (dry run by default, `--apply` to write).

If a new lookup-by-title is ever added, add its key shape to both scripts — or
better, look content up by `id`.
