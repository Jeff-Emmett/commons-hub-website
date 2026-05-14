"use server";

import { readItems, readSingleton } from "@/lib/directus/client";
import { Database } from "@/lib/database.types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];

export type PostWithRelations = PostRow & {
  post_carousel?: { carousel_id: number }[];
  post_accordion?: { accordion_id: number }[];
};

const POST_FIELDS = ["*", "post_carousel.carousel_id", "post_accordion.accordion_id"];

const publishedFilter = (extra: Record<string, unknown> = {}) => ({
  _and: [
    { status: { _eq: "published" } },
    { valid_to: { _gte: new Date().toISOString() } },
    extra,
  ],
});

export async function getPost(id: number): Promise<PostWithRelations | null> {
  if (!id) {
    console.error("Post ID is required");
    return null;
  }
  return readSingleton<PostWithRelations>("posts", {
    fields: POST_FIELDS,
    filter: publishedFilter({ id: { _eq: id } }),
  });
}

export async function getPosts(ids: number[]): Promise<PostWithRelations[]> {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    console.error("Valid post IDs array is required");
    return [];
  }
  return readItems<PostWithRelations>("posts", {
    fields: POST_FIELDS,
    filter: publishedFilter({ id: { _in: ids } }),
    limit: -1,
  });
}

export async function getAllPublishedPosts(): Promise<PostWithRelations[]> {
  return readItems<PostWithRelations>("posts", {
    fields: POST_FIELDS,
    filter: publishedFilter(),
    sort: "-date_created",
    limit: -1,
  });
}

export async function getPostList() {
  try {
    const posts = await readItems<{
      id: number;
      title: string | null;
      slug: string | null;
      status: string;
      date_created: string;
      date_updated: string | null;
    }>("posts", {
      fields: ["id", "title", "slug", "status", "date_created", "date_updated"],
      filter: publishedFilter(),
      sort: "-date_created",
      limit: -1,
    });
    return { error: null, posts };
  } catch (err) {
    console.error("Error in getPostList:", err);
    return { error: "An unexpected error occurred", posts: [] };
  }
}

export async function getPostById(id: number) {
  try {
    const post = await readSingleton<Record<string, unknown>>("posts", {
      fields: ["*"],
      filter: publishedFilter({ id: { _eq: id } }),
    });
    if (!post) return { error: "Post not found", post: null, categories: [] };
    const categoryRows = await readItems<{ category_id: number }>("category_post", {
      fields: ["category_id"],
      filter: { post_id: { _eq: id } },
      limit: -1,
    });
    return {
      error: null,
      post,
      categories: categoryRows.map((r) => r.category_id).filter(Boolean),
    };
  } catch (err) {
    console.error("Error in getPostById:", err);
    return { error: "An unexpected error occurred", post: null, categories: [] };
  }
}

export async function getPostBySlug(slug: string) {
  if (!slug) {
    console.error("Post slug is required");
    return null;
  }
  const data = await readSingleton<PostWithRelations>("posts", {
    fields: POST_FIELDS,
    filter: publishedFilter({ slug: { _eq: slug } }),
  });
  if (!data) return null;
  // Preserve the legacy reshape: post pages expect category_* aliases.
  return {
    ...data,
    category_carousel: data.post_carousel,
    category_accordion: data.post_accordion,
    category_post: [] as { category_id: number; post_id: number }[],
  };
}
