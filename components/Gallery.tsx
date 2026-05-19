import Image from "next/image";

export interface GalleryItem {
  imageUrl: string;
  caption?: string | null;
}

/**
 * Responsive masonry-style gallery: tiles of mixed natural aspect
 * ratios flow into columns (lively, not a vertical list). Images are
 * click-to-expand via the global ContentLightbox (they sit inside a
 * .prose-scoped container so the lightbox picks them up).
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
      <div className="prose max-w-none [column-gap:1rem] columns-2 md:columns-3">
        {items.map((it, i) => (
          <figure key={i} className="mb-4 break-inside-avoid">
            <Image
              src={it.imageUrl}
              alt={it.caption ?? ""}
              width={800}
              height={600}
              sizes="(max-width: 768px) 50vw, 33vw"
              className="w-full h-auto rounded-xl"
            />
            {it.caption && (
              <figcaption className="mt-1 text-xs text-slate-500">
                {it.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}
