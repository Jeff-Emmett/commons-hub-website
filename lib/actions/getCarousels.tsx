"use server";

import { readItems, readSingleton } from "@/lib/directus/client";
import { Database } from "@/lib/database.types";
import { enhanceNestedWithImageUrls } from "@/lib/utils/imageUrlEnhancer";

type CarouselBase = Database["public"]["Tables"]["carousels"]["Row"];
type CarouselItemBase = Database["public"]["Tables"]["carousel_items"]["Row"];

export type CarouselItem = CarouselItemBase & {
  image_url?: string;
};

export type CarouselWithItems = CarouselBase & {
  carousel_items?: CarouselItem[];
};

const CAROUSEL_FIELDS = ["*", "carousel_items.*"];

export async function getCarousel(id: number): Promise<CarouselWithItems | null> {
  if (!id) {
    console.error("Carousel ID is required");
    return null;
  }
  const data = await readSingleton<CarouselWithItems>("carousels", {
    fields: CAROUSEL_FIELDS,
    filter: { id: { _eq: id } },
  });
  if (!data) return null;
  const enhanced = await enhanceNestedWithImageUrls(
    [data],
    "carousel_items",
    "image",
    "image_url",
  );
  return enhanced[0] as CarouselWithItems;
}

export async function getCarousels(ids: number[]): Promise<CarouselWithItems[]> {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    console.error("Valid carousel IDs array is required");
    return [];
  }
  const data = await readItems<CarouselWithItems>("carousels", {
    fields: CAROUSEL_FIELDS,
    filter: { id: { _in: ids } },
    limit: -1,
  });
  if (data.length === 0) return [];
  const enhanced = await enhanceNestedWithImageUrls(
    data,
    "carousel_items",
    "image",
    "image_url",
  );
  return enhanced as CarouselWithItems[];
}
