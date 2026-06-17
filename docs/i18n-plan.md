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
