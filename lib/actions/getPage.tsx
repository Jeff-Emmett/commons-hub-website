"use server";

import { readItems, readSingleton } from "@/lib/directus/client";
import { Database } from "@/lib/database.types";

type PageRow = Database["public"]["Tables"]["pages"]["Row"];

export type PageWithRelations = PageRow & {
  page_post?: { post_id: number }[];
  page_carousel?: { carousel_id: number }[];
  page_accordion?: { accordion_id: number }[];
  page_category?: { category_id: number }[];
};

const PAGE_FIELDS = [
  "*",
  "page_post.post_id",
  "page_carousel.carousel_id",
  "page_accordion.accordion_id",
  "page_category.category_id",
];

export async function getPageById(id: number): Promise<PageWithRelations | null> {
  if (!id) {
    console.error("Page ID is required");
    return null;
  }
  return readSingleton<PageWithRelations>("pages", {
    fields: PAGE_FIELDS,
    filter: { id: { _eq: id } },
  });
}

export async function getPageBySlug(slug: string): Promise<PageWithRelations | null> {
  if (!slug) {
    console.error("Page slug is required");
    return null;
  }
  return readSingleton<PageWithRelations>("pages", {
    fields: PAGE_FIELDS,
    filter: { slug: { _eq: slug } },
  });
}

export async function getHomePage(): Promise<PageWithRelations | null> {
  return readSingleton<PageWithRelations>("pages", {
    fields: PAGE_FIELDS,
    filter: { is_homepage: { _eq: true } },
  });
}

export async function getPages() {
  try {
    const data = await readItems<{ id: number; title: string; slug: string; status: string }>(
      "pages",
      { fields: ["id", "title", "slug", "status"], sort: "sort" },
    );
    return { error: null, pages: data };
  } catch (err) {
    console.error("Unexpected error in getPages:", err);
    return { error: "An unexpected error occurred", pages: null };
  }
}
