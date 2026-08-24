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

  // Directus down => the inquiry itself is not stored; SMTP down => it is
  // stored but nobody is told. Both are outages of a form, so both fail here.
  const ok = smtp.up && listmonk.up && directus.up;
  if (!ok) {
    console.error(
      "FORMS_HEALTH_DEGRADED",
      JSON.stringify({ smtp, listmonk, directus }),
    );
  }
  const body = { ok, smtp, listmonk, directus };
  memo = { at: Date.now(), body, ok };
  return NextResponse.json(body, {
    status: ok ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
