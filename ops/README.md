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
| build context | `./commons-hub-web` — **a git checkout of this repo**, tracking `gitea/main` |
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

The checkout tracks **Gitea**, not GitHub. GitHub is a public mirror and pushing
to it is gated, so a deploy that pulled from there could sit behind the actual
head with nothing saying so. Gitea is where this repo is pushed first.

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

On **GX10** (the web host):

```
*/5 * * * *  form-watchdog.sh check
23 7 * * *   form-watchdog.sh canary
41 6 * * 1   form-watchdog.sh drift
```

On **netcup** (the mail host), same script, `/etc/default/commons-hub-watchdog`:

```
*/10 * * * * /usr/local/bin/form-watchdog.sh bounces
```

Recipients and the canary's credential file live in
`~/.config/commons-hub-watchdog.conf` (0600), never in this repo.

- **check** — `/api/health/forms`, plus `INQUIRY_NOTIFY_FAILED` markers in the
  app log, plus bounces of anything the forms sent.
- **canary** — one real message a day along the path a booking notification
  takes. This is the only check that sees a relay which accepts our AUTH and
  then refuses the mail.
- **drift** — containers whose mail hostname resolves to the wrong host.
- **bounces** — the bounce half, run **on the mail host** because that is where
  the postfix log is. Splitting it that way is why no cross-host access had to be
  invented; each half runs where its evidence lives.

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

### Who watches the watchdog

Uptime Kuma monitor **"commons-hub.at form pipeline watchdog"** (push, id 280).
`check` pings it **only on a fully clean run**, so a heartbeat means "I ran and
everything passed", not merely "I am alive". Fifteen-minute interval tolerates
two missed runs before it pages.

Kuma sits behind Cloudflare Access, which answers a push with a `302` to a login
page — a heartbeat that silently never lands, which is worse than not having one.
So the push goes over the **WireGuard tunnel** straight to the host and bypasses
Cloudflare: `KUMA_PUSH_CURL_OPTS="--resolve status.jeffemmett.com:80:100.64.0.2"`.
Plain HTTP is correct there — the tunnel is the encryption, and the token never
leaves it. The token was created and relayed without ever being printed, per
`dev-ops/netcup/uptime-kuma/mk-tailnet-monitors.py`, whose contract this follows.

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

## Recovering mail from a mailcow that has been switched off

When mail moved GX10 → netcup on 2026-08-24, **100 messages delivered into
GX10's mailcow between 19 and 24 August existed in no other copy.** Netcup's
store had been frozen since 17 August, so its restore contained nothing from that
window — the two stores were not, and never had been, supersets of each other.
Nothing warned about this: both servers looked healthy, and the gap was only
visible by asking the store what it held *by message date*:

```bash
docker exec <dovecot> doveadm search -u <user> mailbox INBOX   sentsince 2026-08-18 sentbefore 2026-08-19 | wc -l      # 0 == a hole
```

The recovery, which has a trap in the middle of it:

1. Archive the stopped volume first, read-only, before anything can prune it:
   `docker run --rm -v mailcowdockerized_vmail-vol-1:/vmail:ro -v $PWD:/out alpine tar czf /out/rescue.tgz -C /vmail .`
2. **Those files are encrypted at rest** (mailcow's `mail_crypt`), with a key that
   lives in that host's `crypt-vol`. Copying them to the other server gets you
   `Decryption error: no private key available`, and copying the key across would
   be far worse — the destination has its own, and its existing mail depends on it.
3. So decrypt on the **source** host, by starting only what dovecot needs — no
   postfix, so the machine cannot send or receive while you work:
   `docker compose up -d mysql-mailcow redis-mailcow dovecot-mailcow`
4. Export with encryption disabled **on write only**; the read path still
   decrypts. This is the whole trick:
   `doveadm -o plugin/mail_crypt_save_version=0 backup -u <user> maildir:/tmp/plain/<slug>`
   (Plain `doveadm backup` re-encrypts with the source key and gets you nowhere.)
5. Move the export to the mail host and import into a **separate, obviously named
   folder** rather than INBOX — additive, greppable, and reversible by deleting it:
   `doveadm import maildir:/tmp/plain/<slug> -u <user> Recovered-gx10-Aug2026 all`
6. Stop the source stack again and verify a message actually reads:
   `doveadm fetch -u <user> hdr mailbox "Recovered-gx10-Aug2026/INBOX" uid 1`

Do not pipe `doveadm` through `head` while it works — SIGPIPE truncates the run
and you get a partial export that looks like a complete one.

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
