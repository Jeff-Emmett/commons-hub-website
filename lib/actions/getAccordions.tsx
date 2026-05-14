"use server";

import { readItems, readSingleton } from "@/lib/directus/client";
import { Database } from "@/lib/database.types";
import { enhanceNestedWithImageUrls } from "@/lib/utils/imageUrlEnhancer";

type AccordionBase = Database["public"]["Tables"]["accordions"]["Row"];
type AccordionItemBase = Database["public"]["Tables"]["accordion_items"]["Row"];

export type AccordionItem = AccordionItemBase & {
  image_url?: string;
  title?: string;
  image?: string;
};

export type AccordionWithItems = AccordionBase & {
  accordion_items?: AccordionItem[];
};

const ACCORDION_FIELDS = ["*", "accordion_items.*"];

function aliasItemFields(accordion: AccordionWithItems): AccordionWithItems {
  if (!accordion.accordion_items) return accordion;
  return {
    ...accordion,
    accordion_items: accordion.accordion_items.map((item) => ({
      ...item,
      title: item.header ?? undefined,
      image: item.main_image ?? undefined,
    })),
  };
}

export async function getAccordion(id: number): Promise<AccordionWithItems | null> {
  if (!id) {
    console.error("Accordion ID is required");
    return null;
  }
  const data = await readSingleton<AccordionWithItems>("accordions", {
    fields: ACCORDION_FIELDS,
    filter: { id: { _eq: id } },
  });
  if (!data) return null;
  const enhanced = await enhanceNestedWithImageUrls(
    [data],
    "accordion_items",
    "main_image",
    "image_url",
  );
  return aliasItemFields(enhanced[0] as AccordionWithItems);
}

export async function getAccordions(ids: number[]): Promise<AccordionWithItems[]> {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    console.error("Valid accordion IDs array is required");
    return [];
  }
  const data = await readItems<AccordionWithItems>("accordions", {
    fields: ACCORDION_FIELDS,
    filter: { id: { _in: ids } },
    limit: -1,
  });
  if (data.length === 0) return [];
  const enhanced = await enhanceNestedWithImageUrls(
    data,
    "accordion_items",
    "main_image",
    "image_url",
  );
  return (enhanced as AccordionWithItems[]).map(aliasItemFields);
}

export async function getAccordionsByPageId(pageId: number) {
  if (!pageId) {
    console.error("Page ID is required");
    return [];
  }
  const rows = await readItems<{ accordion_id: number }>("page_accordion", {
    fields: ["accordion_id"],
    filter: { page_id: { _eq: pageId } },
    limit: -1,
  });
  const ids = rows.map((r) => r.accordion_id).filter(Boolean);
  if (ids.length === 0) return [];
  return getAccordions(ids);
}

export async function getAccordionsByPostId(postId: number) {
  if (!postId) {
    console.error("Post ID is required");
    return [];
  }
  const rows = await readItems<{ accordion_id: number }>("post_accordion", {
    fields: ["accordion_id"],
    filter: { post_id: { _eq: postId } },
    limit: -1,
  });
  const ids = rows.map((r) => r.accordion_id).filter(Boolean);
  if (ids.length === 0) return [];
  return getAccordions(ids);
}
