# Artizen campaign integration

The Commons Hub runs a match-funded campaign — **Valley of the Common** — on
[Artizen](https://artizen.fund/index/p/valley-of-the-common?season=6).

## Why we hand off instead of processing payments ourselves

Artizen's value is its **match funding + season prize**, and that accounting
only happens inside Artizen's own backend. Every \$1 of Artifact sales unlocks
\$1 from each backing Fund, and the top-selling project in the season wins a cash
prize. A dollar collected off-platform (our own Stripe, a cloned NFT mint, etc.)
would **not** count toward our match or leaderboard rank — it would actively cost
us money. So the actual purchase always hands off to artizen.fund. On-site we
only **describe** the campaign and optionally show **live stats**.

What we built:

- `lib/services/artizen.ts` — campaign config, deep-link builder, optional live-stats fetch.
- `app/support/page.tsx` + `components/support/ArtizenSupport.tsx` — the `/support` page.
- `components/support/ArtizenTeaser.tsx` — homepage teaser (rendered inside `HomeJourney`).
- Footer link (`SiteFooter.tsx`) and `/support` added to `middleware.ts` public prefixes.

Campaign details live in one place — `ARTIZEN_CAMPAIGN` in `lib/services/artizen.ts`
(`projectSlug`, `season`, `artifactPriceUsd`). Update the season there each round.

## Tier 2 — lighting up live stats (optional)

The widget shows a static "live on Artizen" badge + CTA by default. To show live
numbers (raised, Artifacts sold, match unlocked), set `ARTIZEN_STATS_URL` to a
JSON endpoint returning:

```json
{
  "artifactsSold": 142,
  "raisedUsd": 1420,
  "matchUnlockedUsd": 4260,
  "goalUsd": 10000,
  "seasonEndsAt": "2026-08-31T00:00:00Z"
}
```

Any field may be omitted/null; the widget degrades per-field. Cached 5 min.

### Finding the data source — investigated, deprioritized

The current artizen.fund is a **Bubble.io app** (`artizenleaderboard`), not the
Hasura/GraphQL stack of their old open-source frontend. Checkout is crypto-wallet
via **Privy + WalletConnect** (card path is a Privy on-ramp settling on-chain).
A 2026-06 DOM capture of the project page confirmed there is **no clean public
stats endpoint**:

- The served HTML ships the live fields as **empty / `$0`** Bubble attributes
  (`data-pbsales=""`, `data-pbmatch=""`, `data-pbavailable="0"`, etc.) plus a raw
  `data-pbfundcompetitors` blob (`sales|score` rows per competitor).
- The visible numbers (raised, rank, prize) are **computed client-side** by inline
  `<script>` blocks *after* Bubble's `GET /api/1.1/init/data?location=<url>` call
  hydrates the page. A plain server-side `fetch` therefore returns zeros.
- `/api/1.1/init/data` is public but returns **obfuscated Bubble field names**
  (`baTaTaIh`…) and the script tags are versioned weekly
  (e.g. `2026-06-12-face-value-match-v2`), so any parser is fragile.

The only reliable way to read live numbers is a **headless browser** (Playwright/
Puppeteer) that renders the page, lets the JS run, then scrapes `#fcTotalRaisedValue`
/ `[data-pbsales]` etc. on a cron into a JSON file pointed at by `ARTIZEN_STATS_URL`.
Given the maintenance cost and that season rounds are short-lived, **Tier 2 was
deprioritized** — the static CTA is fully functional on its own. Revisit only if a
live progress bar on-site becomes a priority for an active round.

## Translations — NATIVE REVIEW NEEDED

The `support` namespace and `links.support` in `messages/{de,hu,cs,sk}.json` are
machine-translated. Brand terms (Artizen, Artifact, "Valley of the Common",
Fund, \$10) were intentionally left untranslated to match the platform. A native
speaker should review:

- [ ] `de.json` → `support.*`, `links.support`
- [ ] `hu.json` → `support.*`, `links.support`
- [ ] `cs.json` → `support.*`, `links.support`
- [ ] `sk.json` → `support.*`, `links.support`
