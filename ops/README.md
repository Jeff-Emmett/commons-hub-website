# Running commons-hub.at — runbook

Where it lives, how to deploy it, and every way its forms have died so far.

## Where it runs

The site runs on **GX10** (`ssh gx10`), in the failover stack. **Mail does not.**
Mail moved back to netcup on 2026-08-24; the two live on different hosts now,
and most of this document is about that seam.

| | |
|---|---|
| compose | `/home/mycopunk/apps/netcup-failover/docker-compose.commons-hub.yml` |
| env | `.env.commons-hub` in the same directory (vars prefixed `WEB_`) |
| build context | `./commons-hub-web` — **a git checkout of this repo, `main`** |
| containers | `commons-hub-web`, `commons-hub-directus`, `commons-hub-directus-db` |
| newsletter | `commons-hub-listmonk` + `-db`, project `commons-hub-newsletter` |
| public path | Cloudflare tunnel → `cloudflared-failover` → `commons-hub-web:3000` |
| mail | **netcup** (`159.195.32.209`), reached as `mail.rmail.online:587` |

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

Env-only changes still need `up -d --force-recreate`: a container's environment
is fixed when it is created, so editing `.env.commons-hub` alone changes nothing.

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

Recipients and the canary's credential file live in
`~/.config/commons-hub-watchdog.conf` (0600), never in this repo.

- **check** — `/api/health/forms`, plus `INQUIRY_NOTIFY_FAILED` markers in the
  app log, plus bounces of anything the forms sent.
- **canary** — one real message a day along the path a booking notification
  takes. This is the only check that sees a relay which accepts our AUTH and
  then refuses the mail.
- **drift** — containers whose mail hostname resolves to the wrong host.

### The watchdog's two transports, and why they differ

An alert must not travel the path it is reporting on, so the two are separate:

- **Alerts** go to `mail.rmail.online:25`, unauthenticated, to a mailbox the
  mail server hosts itself. No credentials, so an alert survives a credential
  problem — which is one of the things being watched. When mailcow runs on the
  same host the alert is handed to the container directly instead.
- **The canary** authenticates on `:587` with the **website's own** submission
  credentials, read at run time from `.env.commons-hub` via `CANARY_CRED_FILE`,
  and goes to an **external** mailbox. It uses the site's credentials on purpose:
  those are the thing under test. Without them it falls back to a local mailbox
  and says so in the log — that still proves the server accepts our mail, but
  not the external hop, which is where two of the three failures actually were.

Port 25 is **greylisted**: the first message to a new sender/recipient pair is
deferred `451` and delivered on a retry. That is handled, and finding it exposed
a real bug — the alert's cooldown stamp used to be written *before* the send, so
a deferred alert was swallowed for an hour and reported to nobody. The stamp is
now written only after the mail has actually left, and the canary retries across
the greylist window before calling anything a failure.

Set `KUMA_PUSH_URL` in the config to an Uptime Kuma *Push* monitor and Kuma will
alert when the watchdog itself stops running — otherwise nothing watches the
watcher.

**Known gap:** with mail on another host, the watchdog cannot read the mail
server's queue, so bounce correlation is **skipped** and says so rather than
reporting a clean run. Point `MAIL_LOG_CMD` at a command that prints netcup's
postfix log (it needs access this host does not currently have) to get it back.

## The traps, in the order they bit

1. **A mail hostname that resolves to the machine you are on.**
   `mail.rmail.online` is the mail server's public name. While mailcow ran on
   GX10 the name pointed at GX10's own WAN address, and from inside a container
   that hairpins and never connects (`ECONNREFUSED`) — so containers were given
   `extra_hosts: ["mail.rmail.online:host-gateway"]`, or addressed the container
   directly. **On 2026-08-24 mail moved to netcup and every one of those
   mappings inverted**: the name now resolved to a host with no mail server, and
   thirteen containers went quietly mute. All of them have been reverted — public
   DNS is correct, so the right configuration is now *no* mapping at all. The
   `drift` check follows the mail server and flags whichever direction is wrong.

2. **The `From:` domain must be accepted by whatever relays the message.**
   From GX10, mail left through Resend, which rejects any `From:` header on a
   domain it has not verified (`550 The commons-hub.at domain is not verified`).
   The envelope sender looks fine in the logs while every message bounces. From
   netcup the mail now goes **direct to the recipient's MX**, so that particular
   rejection is gone — but `MAIL_FROM` stays on `jeffemmett.com` with a display
   name and `Reply-To` set to the guest, because `commons-hub.at` is a Google
   Workspace domain: its MX is Google, its SPF authorizes only Google, and it is
   not a domain this mail server owns. Sending as `contact@commons-hub.at` needs
   that to change first, not just a config edit.

3. **A residential IP cannot deliver to Google.** `news.commons-hub.at` has no
   relayhost, so from GX10 Google refused a slice of it outright
   (`550-5.7.1 ... not authorized to send email directly`). **Resolved by the
   move**: netcup's PTR is `mail.rmail.online`, forward and reverse agree, and
   `news.commons-hub.at`'s SPF is `a:mail.rmail.online`, which now points there.

4. **Two `v=spf1` records is not twice the SPF, it is none.** `commons-hub.at`
   published both `include:_spf.google.com` and a second record whose include
   (`dc-aa8e722993._spfm.commons-hub.at`) did not exist in the zone. Multiple SPF
   records are a PermError under RFC 7208, so receivers could treat everything as
   unauthenticated. The dead record was deleted 2026-08-24; the apex now
   publishes exactly `v=spf1 include:_spf.google.com ~all`.

## Recreating a service whose mail configuration changed

Two things bite here:

- **`--force-recreate` is required.** `extra_hosts` and environment are written
  when the container is created; editing the compose file changes nothing until
  it is.
- **Use the project name the container already has**, not the directory name:

```bash
p=$(docker inspect <container> --format '{{index .Config.Labels "com.docker.compose.project"}}')
cd "$(docker inspect <container> --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}')"
docker compose -p "$p" -f <the file from the labels> up -d --no-deps --force-recreate <service>
```

Without `-p` compose derives a different project, and the recreate fails with
`Conflict. The container name is already in use`. Run `docker compose config -q`
first: a project whose variables do not resolve from that directory will start
with blank credentials rather than refusing.

## Replaying inquiries that were never emailed

The row is in Directus; only the notification was lost.

```bash
docker exec commons-hub-directus-db sh -c \
  'psql -U $POSTGRES_USER -d $POSTGRES_DB -x -c \
   "select * from booking_inquiries where date_created > now() - interval '"'"'7 days'"'"';"'
```

Resend each as a `[Delayed]` mail with `Reply-To` set to the guest, `From` on a
domain the relay accepts, then confirm `status=sent` in the postfix log on the
mail host. There is no per-row "notified" flag, so **filter by `date_created`,
never by `status`** — `status` is booking workflow state, and a naive sweep
re-sends everything.
