import { getAllPublishedPosts } from "@/lib/actions/getPost";
import { getEventPage } from "@/lib/actions/getEventPage";
import { readSingleton } from "@/lib/directus/client";
import {
  HomeJourney,
  type HomeSlide,
  type HomeTile,
  type HomePost,
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

const TILE_ACCOMMODATION = "496f4b23-4e16-47f7-a508-5c270e7aaea2";
const TILE_EVENT = "f6e38335-40a6-4b4c-bfc3-6471c067c38f";
const TILE_ABOUT = "5c842eca-49ad-4afc-b48d-f90734bd0f2a";

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
  const [posts, upcoming] = await Promise.all([
    getAllPublishedPosts(),
    getEventPage("upcoming"),
  ]);
  const slides = await loadHeroSlides();
  const nextEvent = upcoming[0] as
    | { main_image?: string | null; title?: string | null }
    | undefined;

  const tiles: HomeTile[] = [
    { label: "Book your Stay", href: "/accommodation", imageUrl: asset(TILE_ACCOMMODATION) },
    { label: "Plan an Event", href: "/event-venue", imageUrl: asset(TILE_EVENT) },
    {
      label: "Upcoming Events",
      href: "/events",
      imageUrl: asset(nextEvent?.main_image) ?? asset(TILE_EVENT),
    },
    { label: "Read More", href: "/about", imageUrl: asset(TILE_ABOUT) },
  ];

  const postTiles: HomePost[] = posts.map((p) => ({
    title: p.title ?? "",
    slug: p.slug ?? "",
    imageUrl: asset(p.main_image) ?? asset(p.main_icon),
  }));

  return <HomeJourney slides={slides} tiles={tiles} posts={postTiles} />;
}
