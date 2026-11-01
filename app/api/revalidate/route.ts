import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { CONTENT_TAG } from "@/lib/directus/client";

// Called by the Directus flow "Refresh website on content change" on every
// create/update/delete of website content (the collection list lives in
// scripts/cms/directus-schema-apply.mjs). Every public Directus read is cached
// under one tag (lib/directus/client.ts), so one blanket purge covers every
// page -- simpler and safer than keeping a path list in step with the schema.
// Without this call an edit still appears, within the 60-second cache window.
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  const given = request.headers.get("x-revalidate-secret") ?? "";
  if (!secret || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  revalidateTag(CONTENT_TAG);
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
