# Running commons-hub.at — runbook

Where it lives, how to deploy it, and every way its forms have died so far.

## Where it runs

Everything runs on **netcup** (`ssh netcup-full`) — site, database, newsletter
**and mail, on the same host**. That is the point: for a week the site lived on
GX10 while mail lived here, and every failure in this document came from that
seam. It was closed on 2026-08-24.

| | |
|---|---|
| app compose | `/opt/apps/commons-hub-app/docker-compose.yml` (a checkout of this repo, tracking `gitea/main`) |
| directus | `/opt/apps/commons-hub-directus/` |
| newsletter | `/opt/apps/commons-hub-listmonk/` |
| containers | `commons-hub-web`, `commons-hub-directus(-db)`, `commons-hub-listmonk(-db)`, `commons-hub-files` |
| public path | Cloudflare (proxied **A record** → `159.195.32.209`) → traefik → `commons-hub-web:3000` |
| mail | **local** mailcow, reached as `mail.rmail.online:587` via `extra_hosts: host-gateway` |
| secrets | **Infisical** (`commons-hub-app`/prod), injected by `/opt/infisical/entrypoint-wrapper.sh`; only `INFISICAL_CLIENT_ID`/`SECRET` sit in `.env` |

`docker compose config` will warn that `LISTMONK_TOKEN` and friends are unset.
That is expected — those arrive from Infisical at container start, not from
compose.

**Why an A record and not the tunnel.** netcup's tunnel is **remotely
managed**: cloudflared fetches its ingress from Cloudflare, not from
`/root/.cloudflared/config.yml`, and that set is 457 rules ending in a
`http_status:404` default. There is no rule for `commons-hub.at`, so pointing it
at the tunnel hit the default and returned 404 while traefik served the identical
request locally with 200. A proxied A record goes straight to traefik, which is
how `wiki`, `staging` and `api` on this zone already work.

To add a hostname to the tunnel instead, add the rule **remotely** (Zero Trust →
Networks → Tunnels → Published routes). Note the API for this is a *full replace*
of all 457 rules, so it is not something to script casually for one hostname.

Restarting cloudflared is **safe** — it re-fetches the same remote config
(verified 2026-08-25: rule count and every sampled hostname unchanged across a
restart). What is *not* safe is trusting `config.yml`: it used to carry a
nine-line `ingress:` block that was never in effect, and reading it as
authoritative is what made this get diagnosed backwards the first time. That
block has been removed and replaced with a comment saying where routing really
lives.

The old GX10 stack (`/home/mycopunk/apps/netcup-failover/docker-compose.commons-hub.yml`)
is stopped, not deleted, with its volumes intact.

### Deploy

```bash
ssh netcup-full
cd /opt/apps/commons-hub-app && git pull --ff-only
docker compose build web && docker compose up -d web
curl -s https://commons-hub.at/api/health/forms      # expect {"ok":true,...}
```

The checkout tracks **Gitea**, not GitHub. GitHub is a public mirror and pushing
to it is gated, so a deploy that pulled from there could sit behind the actual
head with nothing saying so. Gitea is where this repo is pushed first.

`git status` in that checkout is **not** clean, deliberately: `docker-compose.yml`
carries a local override adding the Infisical gated entrypoint, which is not in
the repo. Preserve it across pulls — a `git checkout .` there would start the
container with no secrets. Anything it lists is a change that
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

All of it on **netcup**, `/usr/local/bin/form-watchdog.sh`, config in
`/etc/default/commons-hub-watchdog` (0600):

```
*/5 * * * *  form-watchdog.sh check
23 7 * * *   form-watchdog.sh canary
41 6 * * 1   form-watchdog.sh drift
```

The `bounces` subcommand still exists for the case where site and mail are split
across hosts again; it is not scheduled while they share one.

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

### The watchdog's transports

An alert must not travel the path it is reporting on. With mail on this host,
both alerts and the canary are handed straight to the mail container's
`sendmail` — no network, no credentials, nothing to drift. The canary's delivery
is then read back out of the postfix log, which is the only check that catches a
relay accepting our AUTH and then refusing the message.

The script still carries the split-host machinery, because it earned it: when
mail was remote, alerts went unauthenticated to port 25 (which is **greylisted**,
deferring the first message to a new sender/recipient pair) and the canary needed
the site's own credentials to be relayed off-site. Finding the greylist exposed a
real bug — the alert's cooldown stamp was written *before* the send, so a
deferred alert was swallowed for an hour and reported to nobody. The stamp is now
written only after the mail has actually left.

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

0. **Splitting the site from its mail server.** Every other trap here is a
   symptom of this one. For a week the site ran on GX10 and mail on netcup, and
   that seam produced: a hairpinning hostname, a relay that refused our `From:`,
   a residential IP Google rejected, a watchdog that could not read the mail log,
   a canary that needed shared credentials to be relayed at all, and finally a
   **fail2ban ban on GX10's entire WAN address** — triggered by *unrelated* GX10
   services retrying stale mail passwords — which silently took the forms down
   again. Same host means none of those exist. That is why the site now lives
   next to its mail server.

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
   On this host the mapping is **correct and required** (`extra_hosts:
   ["mail.rmail.online:host-gateway"]` on `commons-hub-web`), because mailcow is
   here and the public name points at this machine's own WAN address.

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
