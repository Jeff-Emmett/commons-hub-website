import { getAllPublishedPosts } from "@/lib/actions/getPost";
import { getEventPage } from "@/lib/actions/getEventPage";
import { getGalleryCarousels } from "@/lib/actions/getCarousels";
import { readSingleton } from "@/lib/directus/client";
import { getTranslations } from "next-intl/server";
import {
  HomeJourney,
  type HomeSlide,
  type HomeTile,
  type HomePost,
  type HomePhoto,
} from "@/components/home/HomeJourney";

const DIRECTUS_ASSET_BASE = (
  process.env.NEXT_PUBLIC_DIRECTUS_URL || "https://admin.commons-hub.at"
).replace(/\/$/, "");

const asset = (uuid?: string | null) =>
  uuid ? `${DIRECTUS_ASSET_BASE}/assets/${uuid}` : null;

interface CarouselSlideRow {
  id: number;
  image: string | null;
  quote: string | null;
}
interface NamedCarousel {
  id: number;
  title: string | null;
  carousel_items?: CarouselSlideRow[];
}

const TILE_ACCOMMODATION = "dfa256d9-8691-4491-aeeb-e21150921494";
const TILE_EVENT = "f5d57b34-9a42-44ee-834b-5aae6453d56d";
const TILE_ABOUT = "728e404d-4a88-4ce2-b623-1654d21cfef9";

async function loadHeroSlides(): Promise<HomeSlide[]> {
  const carousel = await readSingleton<NamedCarousel>("carousels", {
    fields: [
      "id",
      "title",
      "carousel_items.id",
      "carousel_items.image",
      "carousel_items.quote",
    ],
    filter: { title: { _eq: "home_hero" } },
  });
  const items = carousel?.carousel_items ?? [];
  return items
    .filter((i) => i.image)
    .slice(0, 4)
    .map((i) => ({
      imageUrl: asset(i.image) ?? "",
      body: i.quote ?? "",
    }));
}

export default async function Home() {
  const [posts, upcoming, galleries, t] = await Promise.all([
    getAllPublishedPosts(),
    getEventPage("upcoming"),
    getGalleryCarousels(),
    getTranslations("home"),
  ]);
  const slides = await loadHeroSlides();
  const nextEvent = upcoming[0] as
    | { main_image?: string | null; title?: string | null }
    | undefined;

  const tiles: HomeTile[] = [
    { label: t("bookStay"), href: "/accommodation", imageUrl: asset(TILE_ACCOMMODATION) },
    { label: t("planRetreat"), href: "/event-venue", imageUrl: asset(TILE_EVENT) },
    {
      label: t("upcomingEvents"),
      href: "/events",
      imageUrl: asset(nextEvent?.main_image) ?? asset(TILE_EVENT),
    },
    { label: t("readMore"), href: "/about", imageUrl: asset(TILE_ABOUT) },
  ];

  const postTiles: HomePost[] = posts.map((p) => ({
    title: p.title ?? "",
    slug: p.slug ?? "",
    imageUrl: asset(p.main_image) ?? asset(p.main_icon),
  }));

  // Round-robin across galleries so the preview shows variety, not just one set.
  const galleryItemsByCarousel = galleries.map((g) =>
    (g.carousel_items ?? [])
      .map((it) => (it as { image_url?: string }).image_url ?? "")
      .filter(Boolean),
  );
  const previewPhotos: HomePhoto[] = [];
  const PREVIEW_LIMIT = 8;
  let idx = 0;
  while (previewPhotos.length < PREVIEW_LIMIT) {
    let added = false;
    for (const items of galleryItemsByCarousel) {
      if (idx < items.length) {
        previewPhotos.push({ imageUrl: items[idx] });
        added = true;
        if (previewPhotos.length >= PREVIEW_LIMIT) break;
      }
    }
    if (!added) break;
    idx++;
  }

  return (
    <HomeJourney
      slides={slides}
      tiles={tiles}
      posts={postTiles}
      galleryPreview={previewPhotos}
    />
  );
}
