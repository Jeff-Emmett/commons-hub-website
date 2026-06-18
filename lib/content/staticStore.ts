import "server-only";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { DirectusQuery } from "@/lib/directus/client";

// Serves content from the captured snapshot (content/snapshot/<locale>/) when
// Directus is deactivated. Toggle with USE_STATIC_CONTENT:
//   unset / "true"  -> static snapshot (default; Directus off)
//   "false"         -> live Directus
// Reversible: flip the env var, no code change. See docs/i18n-plan.md.
export const USE_STATIC_CONTENT = process.env.USE_STATIC_CONTENT !== "false";

const SNAP_ROOT = join(process.cwd(), "content", "snapshot");
const DEFAULT_LOCALE = "en";
const cache = new Map<string, unknown[]>();

function load(collection: string, locale: string): unknown[] {
  const key = `${locale}/${collection}`;
  const hit = cache.get(key);
  if (hit) return hit;
  // fall back to the English snapshot if a locale file is missing
  const candidates = [
    join(SNAP_ROOT, locale, `${collection}.json`),
    join(SNAP_ROOT, DEFAULT_LOCALE, `${collection}.json`),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      const rows = JSON.parse(readFileSync(path, "utf8")) as unknown[];
      cache.set(key, rows);
      return rows;
    }
  }
  cache.set(key, []);
  return [];
}

type Row = Record<string, unknown>;

function matchOp(value: unknown, op: string, operand: unknown): boolean {
  const s = (v: unknown) => String(v ?? "");
  switch (op) {
    case "_eq": return value == operand; // loose: handles "1" vs 1, bool coercion
    case "_neq": return value != operand;
    case "_in": return Array.isArray(operand) && operand.some((o) => o == value);
    case "_nin": return Array.isArray(operand) && !operand.some((o) => o == value);
    case "_gte": return s(value) >= s(operand);
    case "_gt": return s(value) > s(operand);
    case "_lte": return s(value) <= s(operand);
    case "_lt": return s(value) < s(operand);
    case "_starts_with": return s(value).startsWith(s(operand));
    case "_istarts_with": return s(value).toLowerCase().startsWith(s(operand).toLowerCase());
    case "_contains": return s(value).includes(s(operand));
    case "_icontains": return s(value).toLowerCase().includes(s(operand).toLowerCase());
    case "_null": return operand ? value == null : value != null;
    case "_nnull": return operand ? value != null : value == null;
    default: return true; // unsupported op -> don't filter it out
  }
}

function matchFilter(row: Row, filter: unknown): boolean {
  if (!filter || typeof filter !== "object") return true;
  for (const [key, cond] of Object.entries(filter as Record<string, unknown>)) {
    if (key === "_and") {
      if (!(cond as unknown[]).every((c) => matchFilter(row, c))) return false;
      continue;
    }
    if (key === "_or") {
      if (!(cond as unknown[]).some((c) => matchFilter(row, c))) return false;
      continue;
    }
    const value = row[key];
    if (cond && typeof cond === "object" && !Array.isArray(cond)) {
      for (const [op, operand] of Object.entries(cond as Record<string, unknown>)) {
        if (!matchOp(value, op, operand)) return false;
      }
    } else if (value != cond) {
      return false;
    }
  }
  return true;
}

function applySort(rows: Row[], sort?: string | string[]): Row[] {
  if (!sort) return rows;
  const keys = Array.isArray(sort) ? sort : [sort];
  return [...rows].sort((a, b) => {
    for (const raw of keys) {
      const desc = raw.startsWith("-");
      const key = desc ? raw.slice(1) : raw;
      const av = a[key], bv = b[key];
      if (av == null && bv == null) continue;
      if (av == null) return desc ? 1 : -1;
      if (bv == null) return desc ? -1 : 1;
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      if (cmp !== 0) return desc ? -cmp : cmp;
    }
    return 0;
  });
}

export function queryStatic<T>(
  collection: string,
  query: DirectusQuery = {},
  locale: string = DEFAULT_LOCALE,
): T[] {
  let rows = (load(collection, locale) as Row[]).filter((r) => matchFilter(r, query.filter));
  rows = applySort(rows, query.sort);
  const offset = query.offset ?? 0;
  const limit = query.limit;
  if (limit !== undefined && limit !== -1) rows = rows.slice(offset, offset + limit);
  else if (offset) rows = rows.slice(offset);
  return rows as T[];
}

export function getItemStatic<T>(
  collection: string,
  id: string | number,
  locale: string = DEFAULT_LOCALE,
): T | null {
  const rows = load(collection, locale) as Row[];
  return (rows.find((r) => r.id == id) as T) ?? null;
}

export function countStatic(
  collection: string,
  filter?: Record<string, unknown>,
  locale: string = DEFAULT_LOCALE,
): number {
  return (load(collection, locale) as Row[]).filter((r) => matchFilter(r, filter)).length;
}

// Resolve the active locale from next-intl when available; fall back to English
// (e.g. before i18n routing is wired, or in scripts/build).
export async function activeLocale(): Promise<string> {
  try {
    const { getLocale } = await import("next-intl/server");
    return (await getLocale()) || DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}
