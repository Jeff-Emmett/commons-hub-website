"use server";

import { readItems, readSingleton } from "@/lib/directus/client";
import { Database } from "@/lib/database.types";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export type CategoryWithRelations = CategoryRow & {
  category_post?: { post_id: number }[];
  category_carousel?: { carousel_id: number }[];
  category_accordion?: { accordion_id: number }[];
};

const CATEGORY_FIELDS = [
  "*",
  "category_post.post_id",
  "category_carousel.carousel_id",
  "category_accordion.accordion_id",
];

export async function getCategoryById(id: number): Promise<CategoryWithRelations | null> {
  if (!id) {
    console.error("Category ID is required");
    return null;
  }
  return readSingleton<CategoryWithRelations>("categories", {
    fields: CATEGORY_FIELDS,
    filter: { id: { _eq: id } },
  });
}

export async function getCategories(ids: number[]): Promise<CategoryWithRelations[]> {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    console.error("Valid category IDs array is required");
    return [];
  }
  return readItems<CategoryWithRelations>("categories", {
    fields: CATEGORY_FIELDS,
    filter: { id: { _in: ids } },
    limit: -1,
  });
}

export async function getCategoriesByPageId(pageId: number) {
  if (!pageId) {
    console.error("Page ID is required");
    return [];
  }
  const rows = await readItems<{ category_id: number }>("page_category", {
    fields: ["category_id"],
    filter: { page_id: { _eq: pageId } },
    limit: -1,
  });
  const ids = rows.map((r) => r.category_id).filter(Boolean);
  if (ids.length === 0) return [];
  return getCategories(ids);
}

export async function getCategoriesByPostId(postId: number) {
  if (!postId) {
    console.error("Post ID is required");
    return [];
  }
  const rows = await readItems<{ category_id: number }>("category_post", {
    fields: ["category_id"],
    filter: { post_id: { _eq: postId } },
    limit: -1,
  });
  const ids = rows.map((r) => r.category_id).filter(Boolean);
  if (ids.length === 0) return [];
  return getCategories(ids);
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryWithRelations | null> {
  if (!slug) {
    console.error("Category slug is required");
    return null;
  }
  return readSingleton<CategoryWithRelations>("categories", {
    fields: CATEGORY_FIELDS,
    filter: { slug: { _eq: slug } },
  });
}

export async function getCategoryList() {
  try {
    const categories = await readItems<{
      id: number;
      title: string | null;
      slug: string | null;
      status: string;
    }>("categories", {
      fields: ["id", "title", "slug", "status"],
      sort: "sort",
      limit: -1,
    });
    return { error: null, categories };
  } catch (err) {
    console.error("Error in getCategoryList:", err);
    return { error: "An unexpected error occurred", categories: [] };
  }
}
