"use server";

import {
  readItem,
  readItems,
  readItemsWithCount,
  createItem,
  updateItem,
  deleteItem as deleteItemAction,
  deleteItems,
  countItems,
} from "@/lib/directus/client";
import { getDirectusToken } from "@/lib/directus/session";

interface GetAllOptions {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  skipSorting?: boolean;
  query?: string;
}

function pagination(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: total ? Math.ceil(total / pageSize) : 0,
  };
}

/**
 * Translate a Supabase `.or(...)` query string into a Directus filter.
 * Supports the limited subset the admin used: `field.ilike.%value%` joined
 * by commas. Returns null if the input doesn't match the pattern, letting
 * the caller fall back to no filter.
 */
function orQueryToFilter(query: string): Record<string, unknown> | null {
  const parts = query.split(",").map((p) => p.trim()).filter(Boolean);
  const clauses: Record<string, unknown>[] = [];
  for (const part of parts) {
    const m = part.match(/^([\w.]+)\.ilike\.%(.+)%$/);
    if (!m) return null;
    const [, field, value] = m;
    clauses.push({ [field]: { _icontains: value } });
  }
  if (clauses.length === 0) return null;
  if (clauses.length === 1) return clauses[0];
  return { _or: clauses };
}

export async function getAll(tableName: string, options: GetAllOptions = {}) {
  const {
    page = 1,
    pageSize = 10,
    sortField = "id",
    sortDirection = "asc",
    skipSorting = false,
    query,
  } = options;
  const token = (await getDirectusToken()) ?? undefined;

  const filter = query ? orQueryToFilter(query) ?? undefined : undefined;
  const sort = skipSorting
    ? undefined
    : (sortDirection === "desc" ? "-" : "") + sortField;

  const { data, total } = await readItemsWithCount<Record<string, unknown>>(
    tableName,
    {
      fields: ["*"],
      filter,
      sort,
      page,
      limit: pageSize,
    },
    token,
  );
  return { data, pagination: pagination(page, pageSize, total) };
}

export async function getById(tableName: string, id: number | string) {
  const token = (await getDirectusToken()) ?? undefined;
  return readItem<Record<string, unknown>>(tableName, id, { fields: ["*"] }, token);
}

export async function create(
  tableName: string,
  item: Record<string, unknown>,
) {
  const { id: _id, ...rest } = item;
  void _id;
  const token = (await getDirectusToken()) ?? undefined;
  return createItem<Record<string, unknown>>(tableName, rest, token);
}

export async function update(
  tableName: string,
  id: number | string,
  item: Record<string, unknown>,
) {
  const { id: _id, ...rest } = item;
  void _id;
  const token = (await getDirectusToken()) ?? undefined;
  return updateItem<Record<string, unknown>>(tableName, id, rest, token);
}

export async function deleteOne(tableName: string, id: number | string) {
  const token = (await getDirectusToken()) ?? undefined;
  return deleteItemAction(tableName, id, token);
}

export async function search(
  tableName: string,
  field: string,
  query: string,
  _select: string = "*",
) {
  void _select;
  const token = (await getDirectusToken()) ?? undefined;
  return readItems<Record<string, unknown>>(
    tableName,
    {
      fields: ["*"],
      filter: { [field]: { _icontains: query } },
      limit: 100,
    },
    token,
  );
}

interface M2MOptions {
  page?: number;
  pageSize?: number;
}

export async function getManyToManyRelationships(
  junctionTable: string,
  foreignKey: string,
  parentId: number | string,
  relatedKey: string,
  options: M2MOptions = {},
) {
  const { page = 1, pageSize = 50 } = options;
  const token = (await getDirectusToken()) ?? undefined;
  const filter = { [foreignKey]: { _eq: parentId } };

  const { data, total } = await readItemsWithCount<Record<string, unknown>>(
    junctionTable,
    {
      fields: ["*", `${relatedKey}.*`],
      filter,
      page,
      limit: pageSize,
    },
    token,
  );
  return { data, pagination: pagination(page, pageSize, total) };
}

export async function deleteByQuery(
  tableName: string,
  foreignKey: string,
  foreignValue: string | number,
  relatedKey?: string,
  relatedValue?: string | number,
) {
  const token = (await getDirectusToken()) ?? undefined;
  const filter: Record<string, unknown> = { [foreignKey]: { _eq: foreignValue } };
  if (relatedKey && relatedValue !== undefined) {
    filter._and = [
      { [foreignKey]: { _eq: foreignValue } },
      { [relatedKey]: { _eq: relatedValue } },
    ];
    delete filter[foreignKey];
  }
  // Directus doesn't accept filter on bulk DELETE; fetch ids then delete.
  const rows = await readItems<{ id: number | string }>(
    tableName,
    { fields: ["id"], filter, limit: -1 },
    token,
  );
  const ids = rows.map((r) => r.id).filter((v) => v !== undefined && v !== null);
  if (ids.length === 0) return true;
  return deleteItems(tableName, ids, token);
}

interface RelatedOptions {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

export async function getRelatedItems(
  relatedTable: string,
  foreignKey: string,
  parentId: number | string,
  options: RelatedOptions = {},
) {
  const {
    page = 1,
    pageSize = 50,
    sortField = "id",
    sortDirection = "asc",
  } = options;
  const token = (await getDirectusToken()) ?? undefined;
  const filter = { [foreignKey]: { _eq: parentId } };
  const sort = (sortDirection === "desc" ? "-" : "") + sortField;

  const { data, total } = await readItemsWithCount<Record<string, unknown>>(
    relatedTable,
    { fields: ["*"], filter, sort, page, limit: pageSize },
    token,
  );
  return { data, pagination: pagination(page, pageSize, total) };
}

export async function count(
  tableName: string,
  filter?: Record<string, unknown>,
) {
  const token = (await getDirectusToken()) ?? undefined;
  return countItems(tableName, filter, token);
}
