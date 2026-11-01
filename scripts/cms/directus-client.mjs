// Shared Directus API helper for the scripts/cms/*.mjs scripts.
//
//   DIRECTUS_URL    e.g. http://commons-hub-directus:8055 (default http://127.0.0.1:8055)
//   DIRECTUS_TOKEN  an ADMIN static token -- schema endpoints need admin, and the
//                   app's own read token cannot create collections or fields.
//   or DIRECTUS_EMAIL + DIRECTUS_PASSWORD (ADMIN_EMAIL / ADMIN_PASSWORD are
//   accepted too, so the scripts work inside the Directus container through the
//   Infisical wrapper without putting credentials in shell history).

const BASE = (process.env.DIRECTUS_URL || 'http://127.0.0.1:8055').replace(/\/$/, '');

let cachedToken = null;

async function resolveToken() {
  if (cachedToken) return cachedToken;
  if (process.env.DIRECTUS_TOKEN) return (cachedToken = process.env.DIRECTUS_TOKEN);
  const email = process.env.DIRECTUS_EMAIL || process.env.ADMIN_EMAIL;
  const password = process.env.DIRECTUS_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('No credentials. Set DIRECTUS_TOKEN, or DIRECTUS_EMAIL + DIRECTUS_PASSWORD.');
  }
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.data?.access_token) throw new Error(`Login failed (${res.status}).`);
  return (cachedToken = json.data.access_token);
}

export async function api(method, urlPath, body) {
  const token = await resolveToken();
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(`${method} ${urlPath} -> ${res.status}: ${JSON.stringify(json.errors || json)}`);
  }
  return json;
}

/** True if the path returns 2xx. Used for idempotent "does this already exist?" checks. */
export async function exists(urlPath) {
  const token = await resolveToken();
  const res = await fetch(`${BASE}${urlPath}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.ok;
}

export async function getAll(collection, query = '') {
  const { data } = await api('GET', `/items/${collection}?limit=-1${query ? `&${query}` : ''}`);
  return data ?? [];
}

export { BASE };
