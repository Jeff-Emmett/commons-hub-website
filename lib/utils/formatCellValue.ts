/**
 * Render a Directus value as a human-readable string for admin list/panel
 * cells. Directus 11 returns relations as id arrays / nested objects and
 * files as objects or UUIDs; naive `String()` / `JSON.stringify()` /
 * `.toString()` then shows "[object Object]", `["61","62"]`, or raw ids.
 *
 * - primitives        -> as-is (strings preserved verbatim; richtext/HTML
 *                         passes through unchanged for callers that render
 *                         it as HTML)
 * - array of objects  -> comma-joined labels
 * - array of ids      -> "N items"
 * - relation/file obj -> first present human label key
 * - empty / null      -> "" (callers decide the placeholder, e.g. "-")
 */
const LABEL_KEYS = [
  "title",
  "name",
  "name_not_used",
  "header",
  "label",
  "quote",
  "text",
  "question",
  "display_name",
  "filename_download",
  "filename_disk",
  "slug",
  "email",
  "first_name",
  "id",
] as const;

export function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    const allObjects = value.every((v) => v && typeof v === "object");
    if (allObjects) {
      const labels = value
        .map((v) => formatCellValue(v))
        .filter((s) => s !== "");
      if (labels.length > 0) return labels.join(", ");
    }
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of LABEL_KEYS) {
      const v = obj[key];
      if (v !== undefined && v !== null && v !== "" && typeof v !== "object") {
        return String(v);
      }
    }
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }

  return String(value);
}
