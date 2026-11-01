import "server-only";
import { cache } from "react";
import type { Metadata } from "next";
import { readItems, readItemsAs, readSingleton } from "@/lib/directus/client";
import { editAttr, type EditAttr } from "@/lib/directus/editAttr";

// Content for the hand-designed pages (Home, Accommodation, Events, ...), the
// footer, the site-wide settings, the small UI texts and the booking prices.
// All of it is Directus: pages -> page_sections -> section_items, plus the
// site_settings / ui_strings / booking_options collections. See
// scripts/cms/directus-schema-apply.mjs for the model and docs/cms/ for the
// editor guide.

const ASSET_BASE = (
  process.env.NEXT_PUBLIC_DIRECTUS_URL || "https://admin.commons-hub.at"
).replace(/\/$/, "");

/** A Directus file id (or an absolute / site-relative URL) as an image URL. */
export function assetUrl(id?: string | null): string | null {
  if (!id) return null;
  if (id.startsWith("/") || id.startsWith("http")) return id;
  return `${ASSET_BASE}/assets/${id}`;
}

export interface SectionItem {
  id: number;
  title: string;
  text: string;
  image: string | null;
  image_alt: string;
  link: string | null;
  link_label: string;
  icon: string | null;
  is_download: boolean;
  anchor: string | null;
  hint: string;
}

export interface Section {
  id: number;
  key: string;
  nav_label: string;
  heading: string;
  text: string;
  button_label: string;
  button_link: string | null;
  image: string | null;
  image_alt: string;
  items: SectionItem[];
}

interface SectionRow extends Partial<Omit<Section, "items" | "key">> {
  section_key: string;
  sort?: number | null;
  items?: (Partial<SectionItem> & { sort?: number | null; status?: string })[] | null;
  status?: string;
}

export interface PageContent {
  id: number;
  slug: string;
  title: string;
  seo_title_tag: string | null;
  seo_description: string | null;
  main_image: string | null;
  sections: Record<string, Section>;
}

const bySort = (a: { sort?: number | null }, b: { sort?: number | null }) =>
  (a.sort ?? 0) - (b.sort ?? 0);

// Strings are always strings ("" when cleared) so a field the editor emptied
// renders empty instead of crashing or resurrecting old copy.
const str = (v: unknown) => (typeof v === "string" ? v : "");

function toSection(row: SectionRow): Section {
  return {
    id: Number(row.id),
    key: row.section_key,
    nav_label: str(row.nav_label),
    heading: str(row.heading),
    text: str(row.text),
    button_label: str(row.button_label),
    button_link: row.button_link || null,
    image: row.image ?? null,
    image_alt: str(row.image_alt),
    items: (row.items ?? [])
      .filter((i) => i && (i.status ?? "published") === "published")
      .sort(bySort)
      .map((i) => ({
        id: Number(i.id),
        title: str(i.title),
        text: str(i.text),
        image: i.image ?? null,
        image_alt: str(i.image_alt),
        link: i.link || null,
        link_label: str(i.link_label),
        icon: i.icon ?? null,
        is_download: Boolean(i.is_download),
        anchor: i.anchor || null,
        hint: str(i.hint),
      })),
  };
}

/**
 * A page row with its sections keyed by section_key. Hidden sections are left
 * out (public permissions only return published rows), so a page renders a
 * slot only when `sections[key]` exists — hiding or deleting a section in
 * Directus removes it from the page.
 */
export const getPageContent = cache(async (slug: string): Promise<PageContent | null> => {
  const page = await readSingleton<{
    id: number;
    slug: string;
    title: string | null;
    seo_title_tag: string | null;
    seo_description: string | null;
    main_image: string | null;
    sections?: SectionRow[] | null;
  }>("pages", {
    fields: [
      "id", "slug", "title", "seo_title_tag", "seo_description", "main_image",
      "sections.*", "sections.items.*",
    ],
    filter: { slug: { _eq: slug } },
  });
  if (!page) return null;
  const sections: Record<string, Section> = {};
  for (const row of (page.sections ?? []).filter((s) => (s.status ?? "published") === "published").sort(bySort)) {
    sections[row.section_key] = toSection(row);
  }
  return {
    id: Number(page.id),
    slug: page.slug,
    title: page.title ?? "",
    seo_title_tag: page.seo_title_tag,
    seo_description: page.seo_description,
    main_image: page.main_image,
    sections,
  };
});

export interface SiteSettings {
  site_name: string;
  contact_email: string;
  address: string[];
  telegram_url: string | null;
  x_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  instagram_handle: string;
  seo_title_default: string;
  seo_title_suffix: string;
  seo_description: string;
  og_title: string;
  og_description: string;
  twitter_description: string;
  og_image: string | null;
  event_fallback_image: string | null;
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const s = (await readSingleton<Record<string, unknown>>("site_settings")) ?? {};
  const url = (k: string) => (typeof s[k] === "string" && s[k] ? (s[k] as string) : null);
  return {
    site_name: str(s.site_name) || "Commons Hub",
    contact_email: str(s.contact_email),
    address: str(s.address).split("\n").map((l) => l.trim()).filter(Boolean),
    telegram_url: url("telegram_url"),
    x_url: url("x_url"),
    instagram_url: url("instagram_url"),
    youtube_url: url("youtube_url"),
    instagram_handle: str(s.instagram_handle).replace(/^@/, ""),
    seo_title_default: str(s.seo_title_default),
    seo_title_suffix: str(s.seo_title_suffix),
    seo_description: str(s.seo_description),
    og_title: str(s.og_title),
    og_description: str(s.og_description),
    twitter_description: str(s.twitter_description),
    og_image: url("og_image"),
    event_fallback_image: url("event_fallback_image"),
  };
});

/** Directus ui_strings for the active locale, as a flat { "a.b": "text" } map. */
export const getUiStrings = cache(async (locale: string): Promise<Record<string, string>> => {
  // Explicit locale: this runs inside next-intl's request config, where
  // getLocale() would recurse.
  const rows = await readItemsAs<{ key: string; value: string | null }>(
    "ui_strings",
    { fields: ["key", "value"], limit: -1 },
    locale,
  );
  return Object.fromEntries(rows.filter((r) => r.key && r.value != null).map((r) => [r.key, r.value as string]));
});

export interface BookingOption {
  option_key: string;
  label: string;
  includes: string;
  capacity: string;
  price_excl_vat: number;
  city_tax_per_night: number;
}

export const getBookingOptions = cache(
  async (kind: "room" | "event_package"): Promise<BookingOption[] | undefined> => {
    const rows = await readItems<Record<string, unknown>>("booking_options", {
      fields: ["*"],
      filter: { kind: { _eq: kind } },
      sort: ["sort"],
      limit: -1,
    });
    if (!rows.length) return undefined;
    return rows.map((r) => ({
      option_key: str(r.option_key),
      label: str(r.label),
      includes: str(r.includes),
      capacity: str(r.capacity),
      price_excl_vat: Number(r.price_excl_vat ?? 0),
      city_tax_per_night: Number(r.city_tax_per_night ?? 0),
    }));
  },
);

/**
 * A hand-designed page's metadata: its pages-row SEO text in the active
 * language, falling back to the built-in values. The layout's title template
 * adds " | Commons Hub".
 */
export async function pageMetadata(slug: string, fallback: { title: string; description?: string }): Promise<Metadata> {
  const page = await getPageContent(slug);
  const title = page?.seo_title_tag || fallback.title;
  const description = page?.seo_description || fallback.description;
  // Empty = inherit the site-wide default from the layout.
  return { ...(title ? { title } : {}), ...(description ? { description } : {}) };
}

const SECTION_FIELDS = [
  "heading", "nav_label", "text", "button_label", "button_link", "image", "image_alt", "items", "translations",
];

/**
 * `data-directus` for a section's root element: clicking it in the Directus
 * Visual Editor opens that section (text, image, list items, translations).
 * Spread it onto an element that already exists, never a new wrapper.
 */
export function sectionEdit(section: Section | undefined): EditAttr | undefined {
  return editAttr("page_sections", section?.id, SECTION_FIELDS, "drawer");
}

/** `data-directus` for one list item of a section (a room, a partner, a link). */
export function itemEdit(item: SectionItem | undefined): EditAttr | undefined {
  return editAttr("section_items", item?.id, ["title", "text", "image", "image_alt", "link", "link_label", "translations"], "drawer");
}

/** A section's items as PinnedCarousel slides (image left, title + text right). */
export function pinnedSlides(section: Section | undefined): { imageUrl: string; title?: string; body: string }[] {
  return (section?.items ?? []).map((i) => ({
    imageUrl: assetUrl(i.image) ?? "",
    title: i.title,
    body: i.text,
  }));
}
