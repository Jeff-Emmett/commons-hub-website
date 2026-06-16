'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { TeamMember } from '@/components/about/AboutGuide';

/**
 * Team carousel (spec: "team members — pics + text — in a slider").
 * Shows one card per view on mobile, two on desktop, with prev/next
 * controls and dot pagination. Card design matches the previous grid.
 */
export function TeamSlider({ team }: { team: TeamMember[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    slidesToScroll: 1,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (!team.length) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {team.map((m) => (
            <div
              key={m.name}
              className="min-w-0 shrink-0 grow-0 basis-full sm:basis-1/2 pr-8"
            >
              <div className="flex gap-4">
                <div className="relative w-24 h-24 shrink-0 rounded-full overflow-hidden bg-slate-200">
                  {m.imageUrl && (
                    <Image
                      src={m.imageUrl}
                      alt={m.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{m.name}</h3>
                  {m.role && <p className="text-sm text-slate-500 mb-1">{m.role}</p>}
                  {m.bio && (
                    <div
                      className="text-sm text-slate-700 about-bio"
                      dangerouslySetInnerHTML={{ __html: m.bio }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {snaps.length > 1 && (
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={scrollPrev}
            disabled={!canPrev}
            aria-label="Previous team members"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900 disabled:opacity-30"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={scrollNext}
            disabled={!canNext}
            aria-label="Next team members"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900 disabled:opacity-30"
          >
            ›
          </button>
          <div className="flex gap-2">
            {snaps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === selectedIndex ? 'bg-slate-900' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
