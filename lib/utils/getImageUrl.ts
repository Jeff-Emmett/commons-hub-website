// Server-side helper: build a Directus /assets URL from a file UUID.
//
// Uses the public host (admin.commons-hub.at) because:
//   - browser <img>/<Image> requests resolve there via Cloudflare
//   - Next.js image optimizer (server fetch from /_next/image) also resolves
//     there — Cloudflare terminates TLS publicly so no self-signed cert issue
//   - same URL works for OG metadata crawled by external sites
const baseUrl = (
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  "https://admin.commons-hub.at"
).replace(/\/$/, "");

export async function getImageUrl(uuidOrName: string | null | undefined): Promise<string> {
  if (!uuidOrName) return "";
  return `${baseUrl}/assets/${uuidOrName}`;
}
