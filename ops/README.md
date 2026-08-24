# Running commons-hub.at — runbook

Where it lives, how to deploy it, and the three ways its forms have died so far.

## Where it runs (since 2026-08-19)

Netcup is gone. The site runs on **GX10** (`ssh gx10`), in the failover stack:

| | |
|---|---|
| compose | `/home/mycopunk/apps/netcup-failover/docker-compose.commons-hub.yml` |
| env | `.env.commons-hub` in the same directory (vars prefixed `WEB_`) |
| build context | `./commons-hub-web` — **a git checkout of this repo, `main`** |
| containers | `commons-hub-web`, `commons-hub-directus`, `commons-hub-directus-db` |
| newsletter | `commons-hub-listmonk` + `-db`, project `commons-hub-newsletter` |
| public path | Cloudflare tunnel → `cloudflared-failover` → `commons-hub-web:3000` (no traefik router) |

Infisical injection is **off** here; `.env.commons-hub` is the config.

### Deploy

```bash
ssh gx10
cd /home/mycopunk/apps/netcup-failover/commons-hub-web && git pull
cd .. && docker compose -f docker-compose.commons-hub.yml --env-file .env.commons-hub \
        build commons-hub-web &&
       docker compose -f docker-compose.commons-hub.yml --env-file .env.commons-hub \
        up -d --no-deps commons-hub-web
curl -s https://commons-hub.at/api/health/forms      # expect {"ok":true,...}
```

`git status` in that checkout must be clean. Anything it lists is a change that
exists only on the box — the failure mode that made "is the fix deployed?"
unanswerable for a week.

## The forms

| Form | Page | Route | Depends on |
|---|---|---|---|
| Stay booking | `/accommodation` | `POST /api/booking-inquiries` | Directus (store) + SMTP (notify office) |
| Event booking | `/event-venue` | same | same |
| Newsletter | home, `/protected` | `POST /api/newsletter` | listmonk (subscribe + welcome mail) |
| Login | `/auth/login` | `POST /api/auth/login` | Directus |

An inquiry is **stored first, notified second**, and a failed notification does
not fail the request — the row is safe, and asking the visitor to retry would
only duplicate it. That is the right trade for the visitor and the reason the
pipeline can be dead for days without a single visible symptom.

## Monitoring

`ops/form-watchdog.sh`, installed on GX10 at `~/bin/form-watchdog.sh`, cron:

```
*/5 * * * *  form-watchdog.sh check
23 7 * * *   form-watchdog.sh canary
41 6 * * 1   form-watchdog.sh drift
```

Recipients live in `~/.config/commons-hub-watchdog.conf` (0600), never in this
repo. Alerts go out through the mail container directly, so an alert still
arrives when the app's own SMTP config is the broken thing.

- **check** — `/api/health/forms`, plus `INQUIRY_NOTIFY_FAILED` markers in the
  app log, plus bounces of anything the forms sent. Alerts once per hour per
  problem and once more on recovery.
- **canary** — one real message a day through the real relay, its fate read out
  of the postfix log. This is the only check that sees a relay which accepts our
  AUTH and then refuses the mail.
- **drift** — containers configured with the public mail hostname (see below).

Set `KUMA_PUSH_URL` in the config to an Uptime Kuma *Push* monitor and Kuma will
alert when the watchdog itself stops running — otherwise nothing watches the
watcher.

## The three traps, in the order they bit

1. **The mail hostname is a hairpin.** `mail.rmail.online` is DDNS onto this
   host's own WAN address. From inside a container it never connects
   (`ECONNREFUSED`). Address the mail server by container name
   (`MAIL_SMTP_HOST=postfix-mailcow`, container joined to
   `mailcowdockerized_mailcow-network`) or map it with
   `extra_hosts: ["mail.rmail.online:host-gateway"]`. Mailcow's certificate on
   that internal hop is self-signed, hence `MAIL_SMTP_TLS_INSECURE=true` — only
   ever for a hop that stays on the docker bridge.

2. **The `From:` domain must be verified at the relay.** Mail from
   `jeffemmett.com` senders leaves through Resend, which rejects any `From:`
   header on a domain it has not verified:
   `550 The commons-hub.at domain is not verified`. The envelope sender looks
   fine in the logs while every message bounces. Until `commons-hub.at` is
   verified in Resend, `MAIL_FROM` stays on `jeffemmett.com` with a display
   name, and `Reply-To` carries the guest.

3. **Domains without that relay send direct from a residential IP.**
   `news.commons-hub.at` (newsletter) has no relayhost, so Google refuses a
   slice of it outright (`550-5.7.1 ... not authorized to send email directly`).
   Verifying the domain at Resend and routing it through the relay is the fix.

## Replaying inquiries that were never emailed

The row is in Directus; only the notification was lost.

```bash
docker exec commons-hub-directus-db sh -c \
  'psql -U $POSTGRES_USER -d $POSTGRES_DB -x -c \
   "select * from booking_inquiries where date_created > now() - interval '"'"'7 days'"'"';"'
```

Resend each as a `[Delayed]` mail with `Reply-To` set to the guest, `From` on a
relay-verified domain, piped to `docker exec -i
mailcowdockerized-postfix-mailcow-1 sendmail -f <sender> <recipients>`, then
confirm `status=sent` in the postfix log. There is no per-row "notified" flag,
so **filter by `date_created`, never by `status`** — `status` is booking
workflow state, and a naive sweep re-sends everything.
