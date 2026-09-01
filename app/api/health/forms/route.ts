import { NextResponse } from "next/server";
import { verifyMail } from "@/lib/mail/mailer";
import { pingListmonk } from "@/lib/listmonk/client";

/**
 * Liveness of everything a website FORM depends on, so a break is caught by a
 * monitor within minutes instead of by a visitor whose inquiry vanished.
 *
 * The booking route's office notification is deliberately best-effort — an
 * inquiry is stored even when the mail fails — which is right for the visitor
 * and terrible for us: the same pipeline has now silently died three times
 * (weeks in July, twelve days in August, five days after the host move) and
 * each time the first signal was a human noticing the quiet. This endpoint is
 * the signal.
 *
 * It never sends mail: SMTP is probed with a connect + AUTH handshake.
 *
 * The response is deliberately opaque — booleans and short codes, no
 * hostnames, credentials or error text — because it is reachable without auth.
 * Details go to the container log.
 */
export const dynamic = "force-dynamic";

type Status = { up: boolean; code?: string };

async function withTimeout<T>(p: Promise<T>, ms: number, onTimeout: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(onTimeout), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const DIRECTUS_URL = (
  process.env.DIRECTUS_URL || "http://commons-hub-directus:8055"
).replace(/\/$/, "");

/**
 * A verified SMTP connection proves we can send. It does not prove there is
 * anyone to send TO, and MAIL_TO_OFFICE not being set is a complete outage of
 * the booking notification that looks exactly like health: the inquiry is
 * stored, the visitor gets a 200, SMTP reports up, and the mail reaches nobody.
 * The booking route already logs INQUIRY_NOTIFY_FAILED / no_recipient for it,
 * but only once an inquiry has already been lost. This catches it before.
 */
function checkRecipient(): Status {
  const raw = (process.env.MAIL_TO_OFFICE || "").trim();
  if (!raw) return { up: false, code: "no_recipient" };

  // Infisical has been observed storing values with their double quotes
  // included — lib/mail/mailer.ts already unwraps MAIL_FROM for exactly that
  // reason, and a quoted address here would be handed to nodemailer verbatim.
  const unwrapped =
    raw.length > 1 && raw.startsWith('"') && raw.endsWith('"')
      ? raw.slice(1, -1).trim()
      : raw;

  // A list is legitimate: nodemailer accepts "a@b, Name <c@d>".
  const parts = unwrapped.split(",").map((s) => s.trim()).filter(Boolean);
  const addr = (s: string) => {
    const m = s.match(/<([^>]+)>/);
    return (m ? m[1] : s).trim();
  };
  const valid = parts.filter((p) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr(p)));

  if (valid.length === parts.length && parts.length > 0) {
    // Say so if only the quote-stripping saved it: the value is still stored
    // wrong and the next thing to read it may not unwrap.
    return unwrapped === raw ? { up: true } : { up: true, code: "quoted" };
  }
  // Counts only — this endpoint is public, so the value never appears here.
  console.error(
    "FORMS_HEALTH_RECIPIENT",
    JSON.stringify({ parts: parts.length, valid: valid.length, quoted: unwrapped !== raw }),
  );
  return { up: false, code: "bad_recipient" };
}

async function pingDirectus(): Promise<Status> {
  try {
    const res = await fetch(`${DIRECTUS_URL}/server/health`, { cache: "no-store" });
    if (!res.ok) return { up: false, code: `http_${res.status}` };
    return { up: true };
  } catch (err) {
    console.error("health: directus unreachable", err);
    return { up: false, code: "connect" };
  }
}

// The SMTP probe authenticates for real, and this endpoint is public. Memoize
// briefly so a monitor (or anyone) polling it cannot turn into an auth storm
// against the mail server. A 60s stale window is far below the time it takes a
// human to notice anything, so it costs no detection speed.
const TTL_MS = 60_000;
let memo: { at: number; body: Record<string, unknown>; ok: boolean } | null = null;

export async function GET() {
  if (memo && Date.now() - memo.at < TTL_MS) {
    return NextResponse.json(memo.body, {
      status: memo.ok ? 200 : 503,
      headers: { "cache-control": "no-store", "x-health-cached": "1" },
    });
  }
  const [smtp, listmonk, directus] = await Promise.all([
    withTimeout(verifyMail(), 8000, { up: false, code: "timeout" } as Status),
    withTimeout(pingListmonk(), 8000, { up: false, code: "timeout" } as Status),
    withTimeout(pingDirectus(), 8000, { up: false, code: "timeout" } as Status),
  ]);
  const recipient = checkRecipient();

  // Directus down => the inquiry itself is not stored; SMTP down => it is
  // stored but nobody is told; no recipient => it is stored, SMTP is fine, and
  // it still reaches nobody. All three are outages of a form, so all three fail
  // here.
  const ok = smtp.up && listmonk.up && directus.up && recipient.up;
  if (!ok) {
    console.error(
      "FORMS_HEALTH_DEGRADED",
      JSON.stringify({ smtp, listmonk, directus, recipient }),
    );
  }
  const body = { ok, smtp, listmonk, directus, recipient };
  memo = { at: Date.now(), body, ok };
  return NextResponse.json(body, {
    status: ok ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
