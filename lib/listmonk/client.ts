import "server-only";

/* Newsletter signups go through the newsletter broker; nothing else here does.
 *
 * They used to be written straight to listmonk's admin API from this container,
 * with `status: "confirmed"` — so everyone who typed an address into the footer
 * was recorded as having confirmed a subscription they were never asked about,
 * on a list that is configured for double opt-in. The broker adds them
 * UNCONFIRMED and sends the confirmation itself, from
 * newsletter@news.commons-hub.at, and nobody joins the list until they click.
 *
 * It also means this container needs no listmonk token for signups. listmonk
 * scopes subscriber permissions globally across every list, so a token here
 * reached every other brand's audience on the shared instance.
 *
 * The `commons-hub.at` apex is on Google Workspace, which is why the sending
 * address is on the `news.` subdomain — it has its own DKIM and SPF and cannot
 * affect their primary mail. The broker owns that mapping.
 */
const BROKER_URL =
  process.env.NEWSLETTER_BROKER_URL?.replace(/\/$/, "") ||
  "http://newsletter-broker:8000";
const NEWSLETTER_DOMAIN = process.env.NEWSLETTER_DOMAIN || "commons-hub.at";

/* Still used by the booking-inquiry office notification below, which is a
 * transactional send and not subscriber management. The default points at the
 * shared instance: `commons-hub-listmonk` was retired in the 2026-08-31
 * consolidation and no longer resolves, so the old default could only fail. */
const LISTMONK_URL =
  process.env.LISTMONK_URL?.replace(/\/$/, "") ||
  "http://clf-listmonk:9000";
const LISTMONK_TOKEN = process.env.LISTMONK_TOKEN || "";
/* Was a workaround for one messenger per tenant, each owning its own From:
   address, because listmonk picked one round-robin and mailcow answered
   "sender not owned by user". The shared instance now authenticates as a single
   account whose sender ACL covers every tenant address, so pinning is no longer
   needed — kept only so an existing pin keeps working. */
const LISTMONK_MESSENGER = process.env.LISTMONK_MESSENGER || "";

type ListmonkResponse<T> = {
  data?: T;
  message?: string;
};

async function listmonkRequest<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  if (!LISTMONK_TOKEN) {
    throw new Error("LISTMONK_TOKEN is not configured");
  }
  const res = await fetch(`${LISTMONK_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      authorization: `token ${LISTMONK_TOKEN}`,
      "content-type": "application/json",
      ...init.headers,
    },
  });
  const text = await res.text();
  const body = text ? (JSON.parse(text) as ListmonkResponse<T>) : ({} as ListmonkResponse<T>);
  if (!res.ok) {
    const err = new Error(body.message ?? `listmonk ${res.status}`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }
  return (body.data ?? ({} as T));
}

export type SubscribeResult = { kind: "subscribed" };

export async function subscribe(email: string, name?: string): Promise<SubscribeResult> {
  const res = await fetch(`${BROKER_URL}/subscribe`, {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ domain: NEWSLETTER_DOMAIN, email, name: name ?? "" }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    // The broker answers with a real error rather than a cheerful "ok" when the
    // write fails. Surface it: a signup that reports success while being
    // discarded is the one failure nobody ever notices.
    let detail = "";
    try {
      detail = ((await res.json()) as { detail?: string }).detail ?? "";
    } catch {
      /* non-JSON error body */
    }
    const err = new Error(detail || `newsletter broker responded ${res.status}`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }

  return { kind: "subscribed" };
}

/**
 * Probe the path a newsletter signup actually takes, which is now the broker
 * and not listmonk. Probing the wrong hop is how this broke last time: the URL
 * pointed at a container that no longer existed and every signup 502'd for five
 * days with nothing watching.
 *
 * /health also reports the broker's tenant list, so a missing mapping for this
 * domain — the failure that returns 400 on every signup — is caught here rather
 * than by a visitor.
 */
export async function pingListmonk(): Promise<{ up: boolean; code?: string }> {
  try {
    const res = await fetch(`${BROKER_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { up: false, code: `http_${res.status}` };
    const body = (await res.json()) as { tenants?: string[] };
    if (!body.tenants?.includes(NEWSLETTER_DOMAIN)) {
      return { up: false, code: "domain_not_mapped" };
    }
    return { up: true };
  } catch (err) {
    console.error("newsletter broker: ping failed", err);
    const msg = err instanceof Error ? err.message : String(err);
    const code = /ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(msg) ? "dns" : "connect";
    return { up: false, code };
  }
}

export interface TransactionalArgs {
  templateId: number;
  recipientEmail: string;
  data?: Record<string, unknown>;
  fromEmail?: string;
}

/**
 * Generic transactional send. Caller supplies templateId and recipient;
 * the template body references {{.Tx.Data.foo}} for variables. Use this
 * for office-bound notifications (booking inquiries, etc.). This is the only
 * thing here that still needs LISTMONK_TOKEN — subscriber signups go through
 * the broker and carry no credential at all.
 */
export async function sendTransactional(args: TransactionalArgs): Promise<void> {
  const txBody: Record<string, unknown> = {
    template_id: args.templateId,
    subscriber_email: args.recipientEmail,
  };
  if (args.data) txBody.data = args.data;
  if (args.fromEmail) txBody.from_email = args.fromEmail;
  if (LISTMONK_MESSENGER) txBody.messenger = LISTMONK_MESSENGER;
  await listmonkRequest<true>("/api/tx", {
    method: "POST",
    body: JSON.stringify(txBody),
  });
}
