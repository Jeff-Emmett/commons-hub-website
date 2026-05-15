'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

const AUTOPLAY_MS = 10_000;

export interface HeroSlide {
  imageUrl: string;
  imageAlt?: string;
  body: string; // HTML
}

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Auto-advance keeps cycling until the user navigates forward at least once.
  // Spec: "returns to slide 1 after slide 4 unless user navigates forward."
  const userAdvancedRef = useRef(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-advance timer. Stops once the user has manually navigated forward.
  useEffect(() => {
    if (!emblaApi) return;
    const timer = window.setInterval(() => {
      if (userAdvancedRef.current) return;
      emblaApi.scrollNext();
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    userAdvancedRef.current = true;
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      userAdvancedRef.current = true;
      emblaApi?.scrollTo(index);
    },
    [emblaApi],
  );

  if (!slides || slides.length === 0) return null;

  return (
    <section className="hero-carousel relative">
      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex">
          {slides.map((slide, i) => (
            <div key={i} className="embla__slide shrink-0 grow-0 basis-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch p-6">
                <div className="md:col-span-2 relative aspect-[16/9] md:aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
                  <Image
                    src={slide.imageUrl}
                    alt={slide.imageAlt ?? ''}
                    fill
                    sizes="(max-width: 768px) 100vw, 66vw"
                    style={{ objectFit: 'cover' }}
                    priority={i === 0}
                  />
                </div>
                <div
                  className="md:col-span-1 flex flex-col justify-center text-base md:text-lg prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: slide.body }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-6 pb-4">
        <button
          type="button"
          onClick={scrollPrev}
          className="text-slate-700 hover:text-slate-900 text-sm font-medium"
          aria-label="Previous slide"
        >
          ← Prev
        </button>

        <div className="flex space-x-3">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              className={`h-3 w-3 rounded-full transition-colors ${
                i === selectedIndex ? 'bg-slate-900' : 'bg-slate-300 hover:bg-slate-500'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={scrollNext}
          className="text-slate-700 hover:text-slate-900 text-sm font-medium"
          aria-label="Next slide"
        >
          Next →
        </button>
      </div>
    </section>
  );
}
