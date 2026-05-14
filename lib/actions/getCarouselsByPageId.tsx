"use server";

import { readItems } from "@/lib/directus/client";
import { getCarousels } from "./getCarousels";

export async function getCarouselsByPageId(pageId: number) {
  if (!pageId) return [];
  const rows = await readItems<{ carousel_id: number }>("page_carousel", {
    fields: ["carousel_id"],
    filter: { page_id: { _eq: pageId } },
    limit: -1,
  });
  const ids = rows.map((r) => r.carousel_id).filter(Boolean);
  if (ids.length === 0) return [];
  return getCarousels(ids);
}
