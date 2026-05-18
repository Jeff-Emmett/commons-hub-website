'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

const ASSET_BASE = (
  process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.commons-hub.at'
).replace(/\/$/, '');

export interface SideSlide {
  /** Directus file UUID or absolute URL */
  image: string;
  title: string;
  body: string; // plain text or simple HTML
}

interface SideCarouselProps {
  /** Fixed headline shown on every slide (e.g. "Common Areas") */
  headline: string;
  slides: SideSlide[];
}

function resolve(img: string): string {
  return img.startsWith('http') || img.startsWith('/')
    ? img
    : `${ASSET_BASE}/assets/${img}`;
}

export function SideCarousel({ headline, slides }: SideCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!slides.length) return null;

  return (
    <div className="side-carousel">
      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex">
          {slides.map((s, i) => (
            <div key={i} className="embla__slide shrink-0 grow-0 basis-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center py-4">
                <div className="md:col-span-2 relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
                  <Image
                    src={resolve(s.image)}
                    alt={s.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 66vw"
                    className="object-cover"
                  />
                </div>
                <div className="md:col-span-1">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">
                    {headline}
                  </p>
                  <h3 className="h2 mb-3">{s.title}</h3>
                  <div
                    className="text-base leading-relaxed text-slate-700"
                    dangerouslySetInnerHTML={{ __html: s.body }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          className="text-slate-600 hover:text-slate-900 text-sm font-medium"
          aria-label="Previous"
        >
          ← Prev
        </button>
        <div className="flex space-x-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i === selected ? 'bg-slate-900' : 'bg-slate-300 hover:bg-slate-500'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          className="text-slate-600 hover:text-slate-900 text-sm font-medium"
          aria-label="Next"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
