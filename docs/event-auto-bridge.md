# Event Auto-Bridge — Design Draft

Propagate a single Commons Hub event to external platforms (Luma, Meetup,
Eventbrite, Facebook, coliven…) from one source of truth, instead of
re-typing each event into every site by hand.

Status: **draft for review**. Nothing built yet. Numbers/endpoints below were
verified against platform docs in June 2026 (see "Platform reality").

---

## 1. Platform reality (verified, June 2026)

This drives the whole design — half the wishlist platforms can't be pushed to.

| Platform   | Programmatic create? | Auth | Gate | Verdict |
|------------|----------------------|------|------|---------|
| **Luma**       | Yes — clean create/update/cancel | API key (`x-luma-api-key`) | Needs **Luma Plus** on the calendar | **Primary target** |
| **Eventbrite** | Yes — create/update/cancel/publish | OAuth2 bearer (instant private token) | None (free account works) | **Primary target** |
| **Meetup**     | Yes via GraphQL | OAuth2 | **Meetup Pro + manual approval** | Secondary, only if we hold Pro |
| **Facebook**   | **No** (Marketing-Partner-only) | — | Closed to general apps | **Dead end** — link only |
| **coliven**    | **No public API found** | — | — | Manual / ask their team |

Implications:
- **Luma + Eventbrite** are the two reliable push targets — build these first.
- **Meetup** is doable but gated; build only if we actually have a Pro account and approved OAuth consumer.
- **Facebook** programmatic event creation was removed for general apps years ago. Best we can do is auto-generate a prefilled share link / post a link to our canonical event page. Don't promise sync.
- **coliven** has no developer surface. Either manual entry, or ask them for a private API / ICS import. Treat as out of scope until confirmed.

> Caveat: Meetup and Eventbrite official doc pages blocked automated fetching,
> so exact Meetup mutation names and a couple of Eventbrite paths need a
> 5-minute manual confirm in a browser before coding.

---

## 2. Design principles

1. **One source of truth.** The Directus event is canonical. Bridge is
   **one-way push** (Hub → platforms). Two-way sync (pulling edits back) is a
   much bigger problem — explicitly out of scope for v1.
2. **Adapter pattern.** One small module per platform with a common interface
   (`create` / `update` / `cancel`). Adding a platform = adding an adapter, no
   changes to the core.
3. **Idempotent.** Store the external event ID per platform after the first
   push, so re-syncs are updates, not duplicates.
4. **Fail soft, per platform.** A Luma failure must not block the Eventbrite
   push. Each target tracks its own status and is independently retryable.
5. **Canonical page first.** Every event has a Hub URL + cover image + Open
   Graph tags + an ICS download. That alone makes the event shareable
   *anywhere*, and is the fallback for platforms we can't push to.

---

## 3. Standardized event schema ("the event information form")

Superset of what Luma / Eventbrite / Meetup require, so one form fills all of
them. Extends the existing Directus `eventpages`/events collection.

| Field | Type | Notes / maps to |
|-------|------|-----------------|
| `title` | string | all |
| `slug` | string | canonical URL |
| `summary` | string (≤140) | social/meta description |
| `description_html` | richtext | Luma/Eventbrite description |
| `description_plain` | derived | platforms that reject HTML |
| `start_at` | datetime + tz | **required everywhere** |
| `end_at` | datetime + tz | required (Eventbrite); recommended |
| `timezone` | IANA string | e.g. `Europe/Vienna` |
| `location_mode` | enum: in_person / online / hybrid | |
| `venue_name`, `address` | string | default to Hub address |
| `geo` | lat/lng | maps + venue matching |
| `online_url` | url | for online/hybrid |
| `cover_image` | Directus asset | all want a cover |
| `hosts` | relation → team_members | |
| `capacity` | int / null | |
| `price` | enum free / paid + amount + currency | gates ticketing |
| `registration_url` | url | defaults to Hub page |
| `category` / `tags` | multiselect | Meetup topics, EB category |
| `visibility` | enum public / unlisted | |
| **`syndication_targets`** | multiselect (luma, eventbrite, meetup, …) | which platforms to push |
| **`syndication_state`** | JSON | per-platform: `{external_id, url, status, last_synced, error}` |

`syndication_state` is the mapping table that makes updates idempotent and
surfaces per-platform errors in the admin UI.

---

## 4. Architecture

```
Directus event (source of truth)
   │  on publish / update  (Directus Flow → webhook)
   ▼
Sync service  (Next.js route handler /api/events/sync  OR  a small worker)
   │  reads syndication_targets, fans out to enabled adapters
   ├──► LumaAdapter        create/update/cancel  → store external_id
   ├──► EventbriteAdapter  create/update/cancel  → store external_id
   ├──► MeetupAdapter      (if Pro) create/update/cancel
   └──► LinkOnlyAdapter    (Facebook/coliven): generate prefilled share URL
   │
   ▼  writes results back into event.syndication_state (per platform)
Admin UI shows per-platform badges: synced / pending / error + "retry"
```

Trigger options (pick one):
- **Directus Flow + webhook** (recommended): event published/updated →
  Directus fires a webhook to `/api/events/sync` with the event id. Reactive,
  no polling.
- **Cron reconcile** (belt-and-suspenders): periodic job that finds events
  whose `date_updated > last_synced` and re-pushes. Catches missed webhooks.

Idempotency: adapter checks `syndication_state[platform].external_id` — absent
→ create; present → update. Cancel when the event is unpublished/deleted.

Secrets: platform API keys/tokens go in **Infisical**, fetched at container
startup (per project policy) — never in the event record or compose file.

---

## 5. Adapter interface

```ts
interface EventAdapter {
  platform: 'luma' | 'eventbrite' | 'meetup';
  create(e: CanonicalEvent): Promise<{ externalId: string; url: string }>;
  update(e: CanonicalEvent, externalId: string): Promise<void>;
  cancel(externalId: string): Promise<void>;
}
```

Per-platform notes:
- **Luma** — base `https://public-api.luma.com`. `POST /v1/events/create`,
  `/v1/events/update`, cancel is two-step (`/v1/events/cancel/request` →
  `/v1/events/cancel`, token expires in 15 min). 200 req/min/calendar.
- **Eventbrite** — create `POST /v3/organizations/{org_id}/events/`, update
  `POST /v3/events/{id}/`, then `POST /v3/events/{id}/publish/`. Created as
  draft until published. Required: name, start, end, currency.
- **Meetup** — single GraphQL endpoint `https://api.meetup.com/gql`, OAuth2,
  draft→publish mutation flow. Only if we have Pro + approved consumer.
- **Facebook / coliven** — `LinkOnlyAdapter`: no push. Produce a prefilled
  Facebook share/compose URL pointing at the canonical event page, and (for
  coliven) surface a "copy details" block for manual entry.

---

## 6. Fallbacks that work everywhere (build these even before adapters)

- **ICS feed** — per-event `.ics` + a calendar-wide feed at e.g.
  `/events/feed.ics`. Any calendar app, and several platforms, can subscribe.
- **Open Graph / Twitter cards** on the canonical event page so pasted links
  render a rich preview on Facebook, Telegram, Slack, etc.
- **Share-intent links** — prebuilt "share to X/Facebook/LinkedIn" URLs.

These are zero-API-dependency and make Phase 0 useful on its own.

---

## 7. Roadmap

- **Phase 0 — Foundation (no external APIs).** Standardize the schema +
  event form; canonical event page; ICS feed; OG tags; share links. Ships
  value immediately, unblocks everything else.
- **Phase 1 — Luma adapter.** Highest-quality API, cleanest mapping. Needs a
  Luma Plus calendar + API key.
- **Phase 2 — Eventbrite adapter.** OAuth onboarding, draft→publish flow.
- **Phase 3 — Meetup** *(only if we hold Pro)* and **assisted Facebook/coliven**
  link flows.
- **Phase 4 — Admin polish.** Per-platform status badges, manual retry,
  cancel propagation, cron reconcile.

---

## 8. Open questions for Jeff

1. Do we already have a **Luma Plus** account and/or **Meetup Pro**? Determines
   whether Phases 1/3 are viable now.
2. Which platforms are actually must-haves vs nice-to-have? (Facebook realism:
   link-only.)
3. Is **coliven** a priority? If so I'll email their team about a private API /
   ICS import — there's no public one.
4. One-way push only for v1 — agreed? (Two-way RSVP/edit sync is a separate,
   larger effort.)
5. Should the canonical event page replace or sit alongside the current
   `/events` rendering?
