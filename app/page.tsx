import { getAllPublishedPosts } from "@/lib/actions/getPost";
import { getEventPage } from "@/lib/actions/getEventPage";
import { getGalleryCarousels } from "@/lib/actions/getCarousels";
import { readSingleton } from "@/lib/directus/client";
import { assetUrl, getPageContent, sectionEdit, itemEdit } from "@/lib/cms/content";
import {
  HomeJourney,
  type HomeSlide,
  type HomeTile,
  type HomePost,
  type HomePhoto,
} from "@/components/home/HomeJourney";

const asset = assetUrl;

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

// The tile that links to /events shows the next upcoming event's photo when
// there is one; its own image is the fallback.
const NEXT_EVENT_TILE_LINK = "/events";

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
  // Content: Directus → Pages → "HOME" → Sections (tiles, blog, gallery_preview);
  // the slideshow is the "home_hero" carousel.
  const [posts, upcoming, galleries, page] = await Promise.all([
    getAllPublishedPosts(),
    getEventPage("upcoming"),
    getGalleryCarousels(),
    getPageContent("home"),
  ]);
  const s = page?.sections ?? {};
  const slides = await loadHeroSlides();
  const nextEvent = upcoming[0] as
    | { main_image?: string | null; title?: string | null }
    | undefined;

  const tiles: HomeTile[] = (s.tiles?.items ?? [])
    .filter((i) => i.title && i.link)
    .map((i) => ({
      label: i.title,
      href: i.link as string,
      imageUrl:
        (i.link === NEXT_EVENT_TILE_LINK ? asset(nextEvent?.main_image) : null) ?? asset(i.image),
      editAttr: itemEdit(i),
    }));

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
      tiles={s.tiles ? tiles : []}
      tilesEdit={sectionEdit(s.tiles)}
      posts={postTiles}
      blog={s.blog ? { heading: s.blog.heading, editAttr: sectionEdit(s.blog) } : undefined}
      galleryPreview={s.gallery_preview ? previewPhotos : []}
      gallery={
        s.gallery_preview
          ? {
              heading: s.gallery_preview.heading,
              linkLabel: s.gallery_preview.button_label,
              href: s.gallery_preview.button_link ?? "/gallery",
              editAttr: sectionEdit(s.gallery_preview),
            }
          : undefined
      }
    />
  );
}
