"use server";

import { readSingleton } from "@/lib/directus/client";
import { getCategoriesByPageId } from "./getCategory";
import { getCarouselsByPageId } from "./getCarouselsByPageId";
import { getAccordionsByPageId } from "./getAccordions";

export async function getSinglePage(slug: string) {
  if (!slug) {
    console.error("Page slug is required");
    return null;
  }

  const page = await readSingleton<{ id: number } & Record<string, unknown>>("pages", {
    fields: ["*"],
    filter: { slug: { _eq: slug } },
  });
  if (!page) return null;

  const [categories, carousels, accordions] = await Promise.all([
    getCategoriesByPageId(page.id).catch(() => []),
    getCarouselsByPageId(page.id).catch(() => []),
    getAccordionsByPageId(page.id).catch(() => []),
  ]);

  return {
    ...page,
    categories,
    carousel: carousels,
    accordions,
  };
}
