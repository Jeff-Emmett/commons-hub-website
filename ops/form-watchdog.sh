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
#           bounces of anything the forms sent
#   canary  (daily)       one real message through the real relay, verified in
#           the postfix log — catches the layer `check` cannot see, where the
#           relay accepts our AUTH but rejects or bounces the mail
#   drift   (weekly)      containers still pointed at the public mail name,
#           which resolves to this host's own WAN IP and never connects
#
# Alerts go out through the mail container directly, NOT through the app's SMTP
# config — the thing most likely to be broken is the thing being watched.
#
#   ./form-watchdog.sh check|canary|drift [--verbose]
#
# Environment (all optional, defaults suit the GX10 failover stack):
#   HEALTH_URL WEB_CONTAINER POSTFIX ALERT_TO ALERT_FROM STATE_DIR
#   COOLDOWN (s, alert de-dup) WINDOW (docker logs lookback) KUMA_PUSH_URL

set -uo pipefail

HEALTH_URL=${HEALTH_URL:-https://commons-hub.at/api/health/forms}
WEB_CONTAINER=${WEB_CONTAINER:-commons-hub-web}
POSTFIX=${POSTFIX:-mailcowdockerized-postfix-mailcow-1}
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
STATE_DIR=${STATE_DIR:-$HOME/.local/state/commons-hub-watchdog}
COOLDOWN=${COOLDOWN:-3600}
WINDOW=${WINDOW:-10m}
KUMA_PUSH_URL=${KUMA_PUSH_URL:-}
# Envelope senders the website's two forms use.
SENDERS=${SENDERS:-'claude@jeffemmett.com|welcome@news.commons-hub.at'}
PUBLIC_MAIL_NAME=${PUBLIC_MAIL_NAME:-mail.rmail.online}
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

# --- alerting ---------------------------------------------------------------
# One mail per problem per COOLDOWN, keyed so a persistent outage does not
# become an hourly inbox flood, and a recovery is reported once.
send_mail() {
  local subject=$1 body=$2
  printf 'From: Commons Hub watchdog <%s>\nTo: %s\nSubject: %s\n\n%s\n' \
    "$ALERT_FROM" "$ALERT_TO" "$subject" "$body" |
    docker exec -i "$POSTFIX" sendmail -f "$ALERT_FROM" "$ALERT_TO" ||
    log "ALERT-SEND-FAILED could not hand the alert to $POSTFIX"
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
  echo "$now" > "$stamp"
  log "ALERT [$key] $subject"
  send_mail "[commons-hub forms] $subject" "$body"
}

clear_alert() {
  local key=$1 what=$2
  local stamp="$STATE_DIR/$key.alerted"
  [ -f "$stamp" ] || return 0
  rm -f "$stamp"
  log "RECOVERED [$key]"
  send_mail "[commons-hub forms] recovered: $what" \
    "$what is healthy again as of $(date -u +%Y-%m-%dT%H:%M:%SZ)."
}

# --- preconditions ----------------------------------------------------------
# A `docker logs` against a container that is gone prints nothing, and a grep
# over nothing finds nothing, so every log-based check below would report
# "clean" precisely when the app has vanished. Fail loudly instead.
running() { [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" = "true" ]; }

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
check_bounces() {
  local logs ids id sender_ids bad="" line
  logs=$(docker logs --since "$WINDOW" "$POSTFIX" 2>&1)
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
  local stamp msgid subject qid status
  require_containers "$POSTFIX" || return 1
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  msgid="canary-$stamp@jeffemmett.com"
  subject="[canary] commons-hub form mail path $stamp"
  printf 'From: Commons Hub <%s>\nTo: %s\nSubject: %s\nMessage-ID: <%s>\n\n%s\n' \
    "$ALERT_FROM" "$CANARY_TO" "$subject" "$msgid" \
    "Automated daily probe of the path a booking notification takes. No action needed." |
    docker exec -i "$POSTFIX" sendmail -f "$ALERT_FROM" "$CANARY_TO"
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
# the PUBLIC mail hostname. That name is DDNS onto this host's own WAN address,
# so from inside a container it hairpins and never connects. Only prints
# variable NAMES -- values may hold credentials.
drift() {
  local c found="" envkeys hosts
  docker info >/dev/null 2>&1 || { log "FATAL docker is unreachable from this account"; return 3; }
  for c in $(docker ps --format '{{.Names}}'); do
    printf '%s' "$c" | grep -qE "$DRIFT_IGNORE_CONTAINERS" && continue
    envkeys=$(docker inspect "$c" --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null |
              grep -F "$PUBLIC_MAIL_NAME" | cut -d= -f1 |
              grep -vE "$DRIFT_IGNORE_KEYS" | tr '\n' ' ')
    [ -z "$envkeys" ] && continue
    hosts=$(docker inspect "$c" --format '{{.HostConfig.ExtraHosts}}' 2>/dev/null)
    case "$hosts" in
      *"$PUBLIC_MAIL_NAME"*) vlog "$c uses $PUBLIC_MAIL_NAME but maps it via extra_hosts - ok" ;;
      *) found="$found
  $c: $envkeys" ;;
    esac
  done
  [ -z "$found" ] && { log "no mail-hostname drift"; clear_alert drift "mail hostname configuration"; return 0; }
  alert drift "containers point at $PUBLIC_MAIL_NAME with no host mapping" \
"These containers run on the mail host yet address the mail server by its
public name, which resolves to this host's own WAN IP. Their mail either
already fails or will the moment they retry. Point them at the mail
container name on the mailcow network, or add
  extra_hosts: [\"$PUBLIC_MAIL_NAME:host-gateway\"]
$found"
  return 1
}

# --- main -------------------------------------------------------------------
rc=0
case "${1:-check}" in
  check)
    docker info >/dev/null 2>&1 || { log "FATAL docker is unreachable from this account"; exit 3; }
    if require_containers "$WEB_CONTAINER" "$POSTFIX"; then
      clear_alert container "the form containers"
      check_dropped_notifications || rc=1
      check_bounces               || rc=1
    else
      rc=1
    fi
    check_health || rc=1
    # Only a fully clean run pings the heartbeat, so a monitor that watches for
    # silence also catches this script dying or the host going away.
    [ $rc -eq 0 ] && [ -n "$KUMA_PUSH_URL" ] && curl -fsS --max-time 10 "$KUMA_PUSH_URL" >/dev/null 2>&1
    ;;
  canary) canary || rc=1 ;;
  drift)  drift  || rc=1 ;;
  *) echo "usage: $0 check|canary|drift [--verbose]" >&2; exit 2 ;;
esac
exit $rc
