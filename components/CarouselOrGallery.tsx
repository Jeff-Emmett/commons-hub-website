import { Carousel } from "@/components/Carousel";
import { Gallery } from "@/components/Gallery";
import type { CarouselWithItems } from "@/lib/actions/getCarousels";

/**
 * A Directus carousel whose title begins with "gallery" (case-insensitive)
 * renders as a responsive image grid instead of a slider — lets content
 * editors make galleries with zero schema/code, just in Directus.
 */
export function CarouselOrGallery({ carousel }: { carousel: CarouselWithItems }) {
  const title = (carousel.title ?? "").trim();
  const isGallery = /^gallery\b/i.test(title) || /^gallery:/i.test(title);

  if (isGallery) {
    const items = (carousel.carousel_items ?? [])
      .map((it) => ({ imageUrl: (it as { image_url?: string }).image_url ?? "" }))
      .filter((it) => it.imageUrl);
    const display = title.replace(/^gallery:?\s*/i, "").trim();
    return <Gallery title={display || undefined} items={items} />;
  }
  return <Carousel carousel={carousel} />;
}
