import "server-only";

import { readItems } from "@/lib/directus/client";
import { Database } from "@/lib/database.types";

type Menu = Database["public"]["Tables"]["menu"]["Row"] & {
  pages: {
    id: number;
    title: string | null;
    slug: string | null;
  } | null;
};

interface DirectusMenuRow {
  id: number;
  menu_order: number | null;
  page_id:
    | { id: number; title: string | null; slug: string | null }
    | number
    | null;
  [key: string]: unknown;
}

export async function getMenu(): Promise<Menu[] | undefined> {
  const rows = await readItems<DirectusMenuRow>("menu", {
    fields: ["*", "page_id.id", "page_id.title", "page_id.slug"],
    sort: "menu_order",
    limit: -1,
  });
  if (!rows || rows.length === 0) return undefined;
  return rows.map((row) => {
    const page = typeof row.page_id === "object" && row.page_id ? row.page_id : null;
    return { ...row, pages: page } as unknown as Menu;
  });
}
