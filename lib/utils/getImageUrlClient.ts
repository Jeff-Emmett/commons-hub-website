// Client-side helper: build a Directus /assets URL from a file UUID.
const baseUrl = (
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  "https://admin.commons-hub.at"
).replace(/\/$/, "");

export async function getImageUrlClient(uuidOrName: string | null | undefined): Promise<string> {
  if (!uuidOrName) return "";
  return `${baseUrl}/assets/${uuidOrName}`;
}
