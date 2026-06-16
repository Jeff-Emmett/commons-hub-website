import Image from "next/image";

export interface GalleryItem {
  imageUrl: string;
  caption?: string | null;
}

/**
 * Uniform square-tile gallery: photos crop to squares in a fixed 3-column
 * grid, so the block always ends flush — no ragged masonry edge, no
 * trailing photo. Tiles are click-to-expand via the global
 * ContentLightbox (.gallery-grid is a lightbox scope) and can be arrowed
 * through with ← / →.
 */
export function Gallery({
  title,
  items,
}: {
  title?: string;
  items: GalleryItem[];
}) {
  if (!items.length) return null;
  return (
    <section className="my-10">
      {title && <h2 className="h2 mb-5">{title}</h2>}
      <div className="gallery-grid grid grid-cols-3 gap-2 md:gap-3">
        {items.map((it, i) => (
          <div
            key={i}
            className="relative aspect-square overflow-hidden rounded-lg bg-slate-100"
          >
            <Image
              src={it.imageUrl}
              alt={it.caption ?? ""}
              fill
              sizes="(max-width: 1024px) 33vw, 360px"
              // Grid tiles load the 360px-optimized source; expose the full-res
              // original so the lightbox can open it at full page size, not the
              // upscaled thumbnail.
              data-full={it.imageUrl}
              className="object-cover cursor-zoom-in transition-transform duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
