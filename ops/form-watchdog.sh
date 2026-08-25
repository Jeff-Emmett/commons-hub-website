#!/usr/bin/env bash
# Watchdog for the commons-hub.at website forms.
#
# WHY THIS EXISTS
# ---------------
# A booking inquiry is stored first and the office is notified second, on a
# best-effort basis: if the mail fails the visitor still gets a success page,
# because making them retry would only duplicate the row. The cost of that
# choice is that a broken notification path looks exactly like a quiet week.
# It has now happened three times — weeks in July 2026, twelve days that
# August, five more after the stack moved to GX10 — and every time the first
# signal was a human wondering where the bookings had gone.
#
# So: something must watch the path itself, not the inquiries.
#
#   check   (every 5 min) health endpoint + dropped-notification markers +
#           bounces of anything the forms sent (when the mail log is readable)
#   bounces (every 10 min) the bounce half alone, to be run ON THE MAIL HOST
#           when mail lives somewhere other than the web host
#   canary  (daily)       one real message through the real relay, verified in
#           the postfix log — catches the layer `check` cannot see, where the
#           relay accepts our AUTH but rejects or bounces the mail
#   drift   (weekly)      containers still pointed at the public mail name,
#           which resolves to this host's own WAN IP and never connects
#
# Alerts never go through the app's SMTP config — the thing most likely to be
# broken is the thing being watched. They go straight to the mail server: the
# local mailcow container when mail runs on this host, otherwise plain SMTP on
# port 25 to the public name, which the mail host accepts for its own domains
# without credentials. So no secret has to live in this file either way.
#
#   ./form-watchdog.sh check|canary|drift [--verbose]
#
# Environment (all optional, defaults suit the GX10 failover stack):
#   HEALTH_URL WEB_CONTAINER POSTFIX MAIL_HOST MAIL_PORT MAIL_LOG_CMD
#   ALERT_TO ALERT_FROM STATE_DIR COOLDOWN (s, alert de-dup)
#   WINDOW (docker logs lookback) KUMA_PUSH_URL

set -uo pipefail

HEALTH_URL=${HEALTH_URL:-https://commons-hub.at/api/health/forms}
WEB_CONTAINER=${WEB_CONTAINER:-commons-hub-web}
POSTFIX=${POSTFIX:-mailcowdockerized-postfix-mailcow-1}
# Mail has lived on this host and off it, and will again; nothing here may
# assume either. When the local mailcow container is running we use it, else we
# talk SMTP to the public name — the same path the website itself takes.
MAIL_HOST=${MAIL_HOST:-mail.rmail.online}
MAIL_PORT=${MAIL_PORT:-25}
# Port 25 needs no credentials for the mail host's own domains, but it is
# greylisted: the first alert to a new sender/recipient pair is deferred 451 and
# goes out on a later run (see alert(), which retries until it is actually
# sent). To make alerts immediate instead, point MAIL_PORT at 587 and supply
# MAIL_USER/MAIL_PASS — authenticated submission is not greylisted. Inject the
# password, never store it here:
#   secretctl run --ref MAIL_PASS=isec://... -- form-watchdog.sh check
MAIL_USER=${MAIL_USER:-}
MAIL_PASS=${MAIL_PASS:-}
# The canary is a different problem from an alert. An alert only has to reach
# us, so it goes to a mailbox the mail server hosts itself and needs no
# credentials. The canary has to cross the hop a BOOKING NOTIFICATION crosses:
# authenticated submission, out to an external address. No mail server relays
# off-site for an unauthenticated client, so the canary needs credentials --
# deliberately the WEBSITE'S OWN, because those are the thing under test. They
# are read from the deploy env file at run time; nothing is copied into this
# repo, the config file, or a command line.
CANARY_HOST=${CANARY_HOST:-$MAIL_HOST}
CANARY_PORT=${CANARY_PORT:-587}
CANARY_CRED_FILE=${CANARY_CRED_FILE:-}
CANARY_USER=${CANARY_USER:-}
CANARY_PASS=${CANARY_PASS:-}
# A command printing the mail server's postfix log, when it is reachable from
# here (e.g. "ssh mailhost docker logs --since 10m postfix"). Usually empty, and
# that is fine: when mail lives on another host the bounce check runs THERE via
# the `bounces` subcommand, where the log is local. Either way the check happens
# somewhere and says where — what must never happen is silently reporting a
# clean run because nothing was looked at.
MAIL_LOG_CMD=${MAIL_LOG_CMD:-}
# No addresses are baked in: this file is public. Put them in the config file
# below (root-owned, 0600) or the environment.
CONFIG=${CONFIG:-/etc/default/commons-hub-watchdog}
# shellcheck source=/dev/null
[ -r "$CONFIG" ] && . "$CONFIG"
# Same file, per-user, for a host where the watchdog does not run as root.
USER_CONFIG=${USER_CONFIG:-$HOME/.config/commons-hub-watchdog.conf}
# shellcheck source=/dev/null
[ -r "$USER_CONFIG" ] && . "$USER_CONFIG"
ALERT_TO=${ALERT_TO:-}
# Must sit on a relay-verified domain, or the alert itself bounces.
ALERT_FROM=${ALERT_FROM:-}
# Where the daily probe is delivered; an external mailbox, so the probe crosses
# the same relay a real notification does. Defaults to the alert recipient.
CANARY_TO=${CANARY_TO:-$ALERT_TO}
# Resolved here, not with the defaults above: the config file is sourced
# between the two, and it is the config file that names the credential file.
if [ -z "$CANARY_USER" ] && [ -n "$CANARY_CRED_FILE" ] && [ -r "$CANARY_CRED_FILE" ]; then
  CANARY_USER=$(sed -n 's/^WEB_MAIL_SMTP_USER=//p' "$CANARY_CRED_FILE" | head -1)
  CANARY_PASS=$(sed -n 's/^WEB_MAIL_SMTP_PASS=//p' "$CANARY_CRED_FILE" | head -1)
fi
STATE_DIR=${STATE_DIR:-$HOME/.local/state/commons-hub-watchdog}
COOLDOWN=${COOLDOWN:-3600}
WINDOW=${WINDOW:-10m}
KUMA_PUSH_URL=${KUMA_PUSH_URL:-}
# Kuma sits behind Cloudflare Access, which answers a push with a 302 to a login
# page — a heartbeat that silently never lands, which is worse than none. The
# push therefore goes over the WireGuard tunnel straight to the host, bypassing
# Cloudflare entirely: plain HTTP is fine there because the tunnel is the
# encryption, and the token never leaves it.
#   KUMA_PUSH_CURL_OPTS="--resolve status.example.com:80:100.64.0.2"
KUMA_PUSH_CURL_OPTS=${KUMA_PUSH_CURL_OPTS:-}
# Envelope senders the website's two forms use.
SENDERS=${SENDERS:-'claude@jeffemmett.com|welcome@news.commons-hub.at'}
PUBLIC_MAIL_NAME=${PUBLIC_MAIL_NAME:-mail.rmail.online}
# Port used to prove a container can actually reach the mail server.
MAIL_PROBE_PORT=${MAIL_PROBE_PORT:-587}
# Tiny image used to probe from inside a container's network namespace.
PROBE_IMAGE=${PROBE_IMAGE:-busybox:latest}
# The mail server naming ITSELF is not drift — MAILCOW_HOSTNAME is its own
# identity, not a client target — and neither is any mailcow container.
DRIFT_IGNORE_KEYS=${DRIFT_IGNORE_KEYS:-'^(MAILCOW_HOSTNAME|MAILCOW_PASS_SCHEME)$'}
DRIFT_IGNORE_CONTAINERS=${DRIFT_IGNORE_CONTAINERS:-'^mailcowdockerized-'}

if [ -z "$ALERT_TO" ] || [ -z "$ALERT_FROM" ]; then
  echo "$0: set ALERT_TO and ALERT_FROM in $CONFIG or the environment" >&2
  exit 2
fi

mkdir -p "$STATE_DIR"
VERBOSE=0
[ "${2:-}" = "--verbose" ] && VERBOSE=1
log() { printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
vlog() { [ "$VERBOSE" = 1 ] && log "$@"; return 0; }

running() { [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" = "true" ]; }
mail_is_local() { running "$POSTFIX"; }

# --- alerting ---------------------------------------------------------------
# One mail per problem per COOLDOWN, keyed so a persistent outage does not
# become an hourly inbox flood, and a recovery is reported once.
# One SMTP transaction, reporting the server's own final word on the message.
# That verdict is the point: a relay that accepts our AUTH and then refuses the
# mail is exactly the failure a connect-only probe cannot see.
smtp_submit() {
  local host=$1 port=$2 from=$3 to=$4 msg=$5
  WD_MSG="$msg" python3 -c '
import os, sys, smtplib
host, port, sender, to = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4]
rcpts = [r.strip() for r in to.split(",") if r.strip()]
s = smtplib.SMTP(host, port, timeout=30)
try:
    s.ehlo()
    # The mail server refuses a cleartext session outright ("550 5.7.1 Session
    # encryption is required"), which is correct of it. Certificate
    # verification stays ON: this hop crosses the public internet, and the name
    # we connect to is the one on the certificate.
    if s.has_extn("starttls"):
        s.starttls()
        s.ehlo()
    user, pw = os.environ.get("SMTP_USER", ""), os.environ.get("SMTP_PASS", "")
    if user and pw:
        s.login(user, pw)
    code, resp = s.docmd("MAIL", "FROM:<%s>" % sender)
    if code != 250:
        print("MAIL FROM refused: %d %s" % (code, resp.decode(errors="replace"))); sys.exit(1)
    for r in rcpts:
        code, resp = s.docmd("RCPT", "TO:<%s>" % r)
        if code not in (250, 251):
            print("RCPT %s refused: %d %s" % (r, code, resp.decode(errors="replace"))); sys.exit(1)
    code, resp = s.data(os.environ["WD_MSG"].encode())
    print("%d %s" % (code, resp.decode(errors="replace").strip().replace(chr(10), " ")))
    sys.exit(0 if code == 250 else 1)
finally:
    try: s.quit()
    except Exception: pass
' "$host" "$port" "$from" "$to" 2>&1
}

# Greylisting defers the first message of a new sender/recipient pair with a
# 4xx and asks us to come back. That is not a fault, so it must not read as
# one: retry within the run, and only call it a failure if the server is still
# saying no after the greylist window (rspamd's default is 5 minutes).
smtp_submit_patient() {
  local host=$1 port=$2 from=$3 to=$4 msg=$5 tries=${6:-6} out i
  for i in $(seq 1 "$tries"); do
    out=$(smtp_submit "$host" "$port" "$from" "$to" "$msg") && { printf '%s' "$out"; return 0; }
    case "$out" in
      *" 4"[0-9][0-9]" "*|*"4.7.1"*|*[Gg]reylist*)
        vlog "deferred (attempt $i/$tries): $out"; [ "$i" -lt "$tries" ] && sleep 70 ;;
      *) printf '%s' "$out"; return 1 ;;   # a 5xx is a real refusal, stop now
    esac
  done
  printf '%s' "$out"
  return 1
}

send_mail() {
  local subject=$1 body=$2 msg
  msg=$(printf 'From: Commons Hub watchdog <%s>\nTo: %s\nSubject: %s\n\n%s\n' \
        "$ALERT_FROM" "$ALERT_TO" "$subject" "$body")
  if mail_is_local; then
    printf '%s\n' "$msg" |
      docker exec -i "$POSTFIX" sendmail -f "$ALERT_FROM" $(printf '%s' "$ALERT_TO" | tr ',' ' ') && return 0
    log "ALERT-SEND-FAILED could not hand the alert to $POSTFIX"
    return 1
  fi
  local out
  out=$(SMTP_USER="$MAIL_USER" SMTP_PASS="$MAIL_PASS" \
        smtp_submit "$MAIL_HOST" "$MAIL_PORT" "$ALERT_FROM" "$ALERT_TO" "$msg") && return 0
  log "ALERT-SEND-FAILED $MAIL_HOST:$MAIL_PORT refused the alert: $out"
  return 1
}

alert() {
  local key=$1 subject=$2 body=$3
  local stamp="$STATE_DIR/$key.alerted"
  local now; now=$(date +%s)
  if [ -f "$stamp" ]; then
    local last; last=$(cat "$stamp" 2>/dev/null || echo 0)
    if [ $((now - last)) -lt "$COOLDOWN" ]; then
      log "STILL-FAILING [$key] (alert suppressed, within cooldown)"
      return 0
    fi
  fi
  log "ALERT [$key] $subject"
  # Record the alert as sent only if it was. Stamping first meant a refused
  # alert -- a greylist 451, a mail server that had gone away -- was swallowed
  # for a whole cooldown: the watchdog would report the outage to nobody and
  # then go quiet about it. Leaving the stamp unwritten makes the next run
  # try again, which is exactly what a deferral asks for.
  if send_mail "[commons-hub forms] $subject" "$body"; then
    echo "$now" > "$stamp"
  else
    log "ALERT-NOT-SENT [$key] will retry on the next run"
  fi
}

clear_alert() {
  local key=$1 what=$2
  local stamp="$STATE_DIR/$key.alerted"
  [ -f "$stamp" ] || return 0
  log "RECOVERED [$key]"
  # Same rule in reverse: keep the stamp until the all-clear has actually gone
  # out, so a deferred recovery notice is retried instead of lost.
  if send_mail "[commons-hub forms] recovered: $what" \
       "$what is healthy again as of $(date -u +%Y-%m-%dT%H:%M:%SZ)."; then
    rm -f "$stamp"
  else
    log "RECOVERY-NOT-SENT [$key] will retry on the next run"
  fi
}

# --- preconditions ----------------------------------------------------------
# A `docker logs` against a container that is gone prints nothing, and a grep
# over nothing finds nothing, so every log-based check below would report
# "clean" precisely when the app has vanished. Fail loudly instead.
require_containers() {
  local c missing=""
  for c in "$@"; do running "$c" || missing="$missing $c"; done
  [ -z "$missing" ] && return 0
  alert container "a container the forms depend on is NOT RUNNING" \
"Not running:$missing

Until it is back, the log-based checks in this watchdog cannot see anything,
so treat their silence as unknown rather than healthy."
  return 1
}

# --- checks -----------------------------------------------------------------
check_health() {
  local body rc
  body=$(curl -fsS --max-time 25 "$HEALTH_URL" 2>&1); rc=$?
  if [ $rc -ne 0 ]; then
    # A 503 from the endpoint also lands here (curl -f), and its body carries
    # which dependency is down.
    body=$(curl -sS --max-time 25 "$HEALTH_URL" 2>&1 | head -c 500)
    alert health "form dependencies are DOWN" \
"$HEALTH_URL did not return OK.

Response: $body

smtp   down => inquiries are stored but the office is never told.
listmonk down => every newsletter signup 502s.
directus down => the inquiry is not even stored.

Detail (hostnames, error text) is in: docker logs $WEB_CONTAINER | grep FORMS_HEALTH_DEGRADED"
    return 1
  fi
  case "$body" in
    *'"ok":true'*) vlog "health ok"; clear_alert health "the form dependency check"; return 0 ;;
    *) alert health "form dependencies are DEGRADED" "$HEALTH_URL returned: $body"; return 1 ;;
  esac
}

check_dropped_notifications() {
  local hits
  hits=$(docker logs --since "$WINDOW" "$WEB_CONTAINER" 2>&1 |
         grep -F 'INQUIRY_NOTIFY_FAILED' | tail -20)
  [ -z "$hits" ] && { vlog "no dropped notifications in $WINDOW"; return 0; }
  alert notify "an inquiry was stored but NOT emailed to the office" \
"The site accepted a booking inquiry and could not notify the office.
The row is safe in Directus; the office does not know about it.

$hits

Replay: find the row by that email in booking_inquiries, resend with the
[Delayed] banner, and check the pipeline before more come in."
  return 1
}

# Correlate postfix's two lines per message: the queue id carries the sender on
# one and the delivery status on another.
# The mail server's log, from wherever it is. Returns non-zero when it cannot
# be read at all — the caller must treat that as "unknown", never as "clean".
mail_log() {
  if mail_is_local; then docker logs --since "$WINDOW" "$POSTFIX" 2>&1
  elif [ -n "$MAIL_LOG_CMD" ]; then eval "$MAIL_LOG_CMD" 2>&1
  else return 1; fi
}

BOUNCE_CHECKED=1
check_bounces() {
  local logs ids id sender_ids bad="" line
  logs=$(mail_log) || {
    BOUNCE_CHECKED=0
    vlog "mail server is elsewhere: bounce correlation runs THERE (\`form-watchdog.sh bounces\` on the mail host), not here"
    return 0; }
  sender_ids=$(printf '%s\n' "$logs" | grep -E "from=<($SENDERS)>" |
               grep -oE '\b[A-F0-9]{8,14}:' | tr -d ':' | sort -u)
  [ -z "$sender_ids" ] && { vlog "no form mail in $WINDOW"; return 0; }
  for id in $sender_ids; do
    line=$(printf '%s\n' "$logs" | grep "$id" | grep -E 'status=(bounced|deferred)' | head -2)
    [ -n "$line" ] && bad="$bad
$line"
  done
  [ -z "$bad" ] && { vlog "form mail all delivered in $WINDOW"; return 0; }
  alert bounce "mail sent BY A FORM bounced or deferred" \
"Postfix could not deliver mail whose sender is one of the website forms.
A 550 naming an unverified domain means the relay rejected our From: header;
a 550 from Google means it refused this IP.
$bad"
  return 1
}

# --- canary -----------------------------------------------------------------
# `check` proves we can authenticate to the mail server. It cannot prove the
# relay will ACCEPT what we hand it -- the exact failure that bounced every
# office notification on 2026-08-24 ("domain is not verified") while AUTH was
# perfectly fine. So put one real message through the real path each day and
# read its fate out of the log.
canary() {
  local stamp msgid subject qid status msg out
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  msgid="canary-$stamp@jeffemmett.com"
  subject="[canary] commons-hub form mail path $stamp"
  msg=$(printf 'From: Commons Hub <%s>\nTo: %s\nSubject: %s\nMessage-ID: <%s>\n\n%s\n' \
        "$ALERT_FROM" "$CANARY_TO" "$subject" "$msgid" \
        "Automated daily probe of the path a booking notification takes. No action needed.")

  if ! mail_is_local; then
    # Mail is on another host. We cannot read its queue from here, so the
    # verdict is the server's own response to DATA — which still catches the
    # case this check exists for (submission accepted, MESSAGE refused). What
    # it cannot see is a bounce generated after acceptance; set MAIL_LOG_CMD to
    # get that back, and until then do not read a pass as proof of delivery.
    local dest=$CANARY_TO host=$CANARY_HOST port=$CANARY_PORT
    if [ -z "$CANARY_USER" ]; then
      # Without credentials we cannot be relayed off-site, so fall back to a
      # mailbox the server hosts. Say so: this still proves the server accepts
      # our mail, but it no longer proves the external hop, which is where the
      # last two failures actually were.
      dest=$ALERT_TO; host=$MAIL_HOST; port=$MAIL_PORT
      log "canary has no credentials (set CANARY_CRED_FILE): probing $host only, NOT the external hop"
    fi
    out=$(SMTP_USER="$CANARY_USER" SMTP_PASS="$CANARY_PASS" \
          smtp_submit_patient "$host" "$port" "$ALERT_FROM" "$dest" "$msg")
    if [ $? -ne 0 ]; then
      alert canary "the mail server REFUSED the daily canary" \
"$host:$port would not take a message from $ALERT_FROM to $dest.

Server said: $out

This is the form notification path. If the server refuses this, it refuses
every booking notification too."
      return 1
    fi
    log "canary accepted by $host for $dest ($out)"
    clear_alert canary "the daily mail canary"
    return 0
  fi

  printf '%s\n' "$msg" | docker exec -i "$POSTFIX" sendmail -f "$ALERT_FROM" "$CANARY_TO"
  sleep 45
  qid=$(docker logs --since 5m "$POSTFIX" 2>&1 | grep -F "message-id=<$msgid>" |
        grep -oE '\b[A-F0-9]{8,14}:' | head -1 | tr -d ':')
  if [ -z "$qid" ]; then
    alert canary "the daily mail canary never reached the queue" \
"Handed a message to $POSTFIX and no queue id appeared for message-id $msgid.
The mail server is not accepting our submissions at all."
    return 1
  fi
  status=$(docker logs --since 5m "$POSTFIX" 2>&1 | grep "$qid" |
           grep -oE 'status=[a-z]+' | tail -1)
  case "$status" in
    status=sent) log "canary ok ($qid)"; clear_alert canary "the daily mail canary"; return 0 ;;
    *) alert canary "the daily mail canary did not deliver ($status)" \
"Queue id $qid, message-id $msgid, final status: ${status:-none seen}.

$(docker logs --since 5m "$POSTFIX" 2>&1 | grep "$qid" | tail -3)"
       return 1 ;;
  esac
}

# --- drift ------------------------------------------------------------------
# The trap that broke this twice: a container on the mail host configured with
# the PUBLIC mail hostname, which can resolve to an address the container cannot
# actually reach. Only prints variable NAMES -- values may hold credentials.
#
# It TESTS rather than assumes. The original version inferred breakage from the
# config alone, which was right on a host behind residential NAT (no hairpin, so
# the connection dies) and WRONG on one whose public IP is bound to its own
# interface (the kernel routes it locally and it just works). On netcup that
# inference flagged seventeen perfectly healthy containers. A monitor that cries
# wolf gets muted, and a muted monitor is the thing this file exists to prevent,
# so the check now opens a socket and believes the result.
probe_container_mail() {
  local c=$1
  # Probed from OUTSIDE, in the container's own network namespace, so the answer
  # is about the container's networking and not about what its image happens to
  # ship. Embedding a probe via `docker exec` meant depending on nc or python
  # being present -- and the python fallback's nested quoting silently produced
  # empty output, which read as "cannot reach" and flagged five healthy
  # containers. A monitor that invents failures gets ignored.
  local net
  net=$(docker inspect "$c" --format '{{.HostConfig.NetworkMode}}' 2>/dev/null)
  if [ "$net" = "host" ]; then
    # Shares this host's stack, so the host's own reachability is the answer.
    nc -z -w6 "$PUBLIC_MAIL_NAME" "$MAIL_PROBE_PORT" >/dev/null 2>&1 && echo OPEN || echo FAIL
    return 0
  fi
  docker run --rm --network "container:$c" "$PROBE_IMAGE" \
    nc -z -w6 "$PUBLIC_MAIL_NAME" "$MAIL_PROBE_PORT" >/dev/null 2>&1 && echo OPEN || echo FAIL
}

drift() {
  local c found="" unverified="" envkeys hosts mail_local=1 mapped
  docker info >/dev/null 2>&1 || { log "FATAL docker is unreachable from this account"; return 3; }
  # If the mail server ever moves off this host, the fix below inverts: a
  # host-gateway mapping would then point at a host with no mail server, and
  # every one of these containers would break in the same silent way. So the
  # check follows the mail server rather than assuming it stays.
  running "$POSTFIX" || mail_local=0
  for c in $(docker ps --format '{{.Names}}'); do
    printf '%s' "$c" | grep -qE "$DRIFT_IGNORE_CONTAINERS" && continue
    envkeys=$(docker inspect "$c" --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null |
              grep -F "$PUBLIC_MAIL_NAME" | cut -d= -f1 |
              grep -vE "$DRIFT_IGNORE_KEYS" | tr '\n' ' ')
    [ -z "$envkeys" ] && continue
    hosts=$(docker inspect "$c" --format '{{.HostConfig.ExtraHosts}}' 2>/dev/null)
    mapped=0
    case "$hosts" in *"$PUBLIC_MAIL_NAME"*) mapped=1 ;; esac

    if [ "$mapped" = 1 ] && [ "$mail_local" = 0 ]; then
      # Unambiguous: the mapping pins the mail name to a host that no longer
      # runs a mail server. No probe needed, and a probe would pass against
      # anything else listening on this box.
      found="$found
  $c: $envkeys (maps $PUBLIC_MAIL_NAME to THIS host, but the mail server is no longer here)"
      continue
    fi

    case "$(probe_container_mail "$c")" in
      OPEN) vlog "$c uses $PUBLIC_MAIL_NAME and reaches it - ok" ;;
      *)    found="$found
  $c: $envkeys (cannot reach $PUBLIC_MAIL_NAME:$MAIL_PROBE_PORT)" ;;
    esac
  done
  [ -n "$unverified" ] && log "could not prove reachability for:$unverified"
  [ -z "$found" ] && { log "no mail-hostname drift"; clear_alert drift "mail hostname configuration"; return 0; }
  # The offending list goes in the log too, not only in the alert mail: chasing
  # "why did drift fire?" through a mailbox is how you end up ignoring it.
  log "drift found:$found"
  if [ "$mail_local" = 1 ]; then
    alert drift "containers point at $PUBLIC_MAIL_NAME with no host mapping" \
"These containers run on the mail host yet address the mail server by its
public name, which resolves to this host's own WAN IP. Their mail either
already fails or will the moment they retry. Point them at the mail
container name on the mailcow network, or add
  extra_hosts: [\"$PUBLIC_MAIL_NAME:host-gateway\"]
$found"
  else
    alert drift "containers still pin $PUBLIC_MAIL_NAME to THIS host, but mail left" \
"The mail server is not running here any more, so these host-gateway mappings
now resolve the mail name to a machine with no mail server — the same silent
failure as before, in the opposite direction. Public DNS already points at the
real mail host, so the fix is to DELETE the mapping and recreate:
  docker compose -p <project> up -d --no-deps --force-recreate <service>
$found"
  fi
  return 1
}

# --- main -------------------------------------------------------------------
rc=0
case "${1:-check}" in
  check)
    docker info >/dev/null 2>&1 || { log "FATAL docker is unreachable from this account"; exit 3; }
    # Only the web container is unconditionally required. The mail container
    # being absent is normal when mail lives on another host, and alerting on
    # it there would cry wolf every five minutes forever.
    REQUIRED="$WEB_CONTAINER"
    mail_is_local && REQUIRED="$REQUIRED $POSTFIX"
    # shellcheck disable=SC2086
    if require_containers $REQUIRED; then
      clear_alert container "the form containers"
      check_dropped_notifications || rc=1
      check_bounces               || rc=1
    else
      rc=1
    fi
    check_health || rc=1
    # A clean run used to print nothing at all, which made a healthy watchdog
    # and a dead one look identical in the log. Say so once per run instead,
    # and name any check that did not actually run — the whole point of this
    # file is that silence must never be mistaken for a pass.
    if [ $rc -eq 0 ]; then
      if [ "$BOUNCE_CHECKED" = 1 ]; then
        log "ok"
      else
        log "ok (bounces checked on the mail host, not here)"
      fi
    fi
    # Only a fully clean run pings the heartbeat, so a monitor that watches for
    # silence also catches this script dying or the host going away.
    if [ $rc -eq 0 ] && [ -n "$KUMA_PUSH_URL" ]; then
      # shellcheck disable=SC2086
      curl -fsS --max-time 10 $KUMA_PUSH_CURL_OPTS "$KUMA_PUSH_URL" >/dev/null 2>&1 ||
        log "HEARTBEAT-FAILED could not reach the Kuma push endpoint"
    fi
    ;;
  # Bounce correlation needs the mail server's log, so when mail and web are on
  # different hosts it belongs on the MAIL host, where the log is local and no
  # cross-host access has to be invented. Same script, same config, one job.
  bounces)
    docker info >/dev/null 2>&1 || { log "FATAL docker is unreachable from this account"; exit 3; }
    require_containers "$POSTFIX" || exit 1
    if check_bounces; then log "bounces ok"; else rc=1; fi
    ;;
  canary) canary || rc=1 ;;
  drift)  drift  || rc=1 ;;
  *) echo "usage: $0 check|bounces|canary|drift [--verbose]" >&2; exit 2 ;;
esac
exit $rc
