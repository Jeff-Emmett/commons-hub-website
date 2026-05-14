import { NextResponse } from "next/server";
import { getDirectusToken } from "@/lib/directus/session";

const DIRECTUS_URL = (
  process.env.DIRECTUS_URL ||
  "http://commons-hub-directus:8055"
).replace(/\/$/, "");

async function requireToken() {
  const token = await getDirectusToken();
  if (!token) {
    return { token: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { token, error: null };
}

export async function GET(request: Request) {
  const { token, error } = await requireToken();
  if (!token) return error!;

  const url = new URL(request.url);
  const params = new URLSearchParams(url.search);
  if (!params.has("fields")) {
    params.set("fields", "id,filename_download,type,filesize,uploaded_on");
  }
  if (!params.has("limit")) params.set("limit", "200");

  const res = await fetch(`${DIRECTUS_URL}/files?${params}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(request: Request) {
  const { token, error } = await requireToken();
  if (!token) return error!;

  const formData = await request.formData();
  const res = await fetch(`${DIRECTUS_URL}/files`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: formData,
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
