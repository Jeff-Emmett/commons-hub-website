import "server-only";

const LISTMONK_URL =
  process.env.LISTMONK_URL?.replace(/\/$/, "") || "http://listmonk:9000";
const LISTMONK_TOKEN = process.env.LISTMONK_TOKEN || "";
const LISTMONK_LIST_ID = Number.parseInt(process.env.LISTMONK_LIST_ID || "0", 10);
const LISTMONK_TEMPLATE_ID = Number.parseInt(
  process.env.LISTMONK_TEMPLATE_ID || "0",
  10,
);

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

type SubscriberCreate = {
  id: number;
  uuid: string;
  email: string;
  status: string;
};

export type SubscribeResult =
  | { kind: "subscribed"; subscriberId: number }
  | { kind: "already_subscribed" };

export async function subscribe(email: string, name?: string): Promise<SubscribeResult> {
  if (!LISTMONK_LIST_ID) {
    throw new Error("LISTMONK_LIST_ID is not configured");
  }
  let subscriber: SubscriberCreate | null = null;
  try {
    subscriber = await listmonkRequest<SubscriberCreate>("/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        email,
        name: name ?? "",
        status: "enabled",
        lists: [LISTMONK_LIST_ID],
      }),
    });
  } catch (err) {
    const status = (err as { status?: number }).status;
    const message = err instanceof Error ? err.message : "";
    const isDuplicate =
      status === 409 ||
      /already exists|duplicate/i.test(message);
    if (!isDuplicate) throw err;
    subscriber = await findSubscriberByEmail(email);
    if (!subscriber) throw err;
  }

  await listmonkRequest<true>("/api/subscribers/lists", {
    method: "PUT",
    body: JSON.stringify({
      ids: [subscriber.id],
      action: "add",
      target_list_ids: [LISTMONK_LIST_ID],
      status: "confirmed",
    }),
  });

  return { kind: "subscribed", subscriberId: subscriber.id };
}

async function findSubscriberByEmail(
  email: string,
): Promise<SubscriberCreate | null> {
  const query = encodeURIComponent(`subscribers.email = '${email.replace(/'/g, "''")}'`);
  const res = await listmonkRequest<{ results: SubscriberCreate[] }>(
    `/api/subscribers?query=${query}&per_page=1`,
    { method: "GET" },
  );
  return res.results?.[0] ?? null;
}

export async function sendWelcome(email: string): Promise<void> {
  if (!LISTMONK_TEMPLATE_ID) {
    throw new Error("LISTMONK_TEMPLATE_ID is not configured");
  }
  await listmonkRequest<true>("/api/tx", {
    method: "POST",
    body: JSON.stringify({
      template_id: LISTMONK_TEMPLATE_ID,
      subscriber_email: email,
    }),
  });
}
