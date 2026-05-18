'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface PinnedSlide {
  imageUrl: string;
  /** Rendered to the right of the image (verbatim HTML). */
  body: string;
}

interface PinnedCarouselProps {
  slides: PinnedSlide[];
  /** Optional fixed headline shown above the body on every slide. */
  headline?: string;
  /** Footer/extra node rendered inside the right text column (last slide). */
  children?: ReactNode;
}

/**
 * Scroll-pinned carousel. The page scrolls normally; while this block is
 * on screen it pins to the viewport and the slides pan right-to-left in
 * proportion to scroll progress. Once the last slide is reached the block
 * unpins and normal page scrolling continues. No scroll hijacking.
 */
export function PinnedCarousel({ slides, headline }: PinnedCarouselProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0); // 0..(n-1), fractional
  const n = Math.max(1, slides.length);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      // progress 0 when the block top reaches the viewport top,
      // 1 when its bottom reaches the viewport bottom.
      const p = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
      setOffset(p * (n - 1));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [n]);

  // Snap to whole slides: scrolling advances to the full next image
  // (animated) rather than continuously panning through partials.
  const active = Math.min(n - 1, Math.max(0, Math.round(offset)));

  return (
    // Tall wrapper gives the scroll distance to page through every slide.
    <div
      ref={wrapRef}
      className="pinned-carousel relative"
      style={{ height: `${n * 100}vh` }}
    >
      <div
        className="sticky overflow-hidden bg-white"
        style={{ top: '5rem', height: 'calc(100vh - 5rem)' }}
      >
        <div
          className="flex h-full"
          style={{
            width: `${n * 100}%`,
            transform: `translateX(-${(active / n) * 100}%)`,
            transition: 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {slides.map((s, i) => (
            <div
              key={i}
              className="h-full flex flex-col md:flex-row"
              style={{ width: `${100 / n}%` }}
            >
              <div className="relative md:w-2/3 h-1/2 md:h-full bg-slate-100">
                <Image
                  src={s.imageUrl}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="(max-width: 768px) 100vw, 66vw"
                  className="object-cover"
                />
              </div>
              <div className="md:w-1/3 h-1/2 md:h-full flex items-center px-8 md:px-12">
                <div>
                  {headline && (
                    <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
                      {headline}
                    </p>
                  )}
                  <div
                    className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-slate-900 home-hero-copy"
                    dangerouslySetInnerHTML={{ __html: s.body }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Slide progress dots */}
        {n > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  i === active ? 'bg-slate-900' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
        )}

        {/* Hint that scrolling pans the carousel */}
        <div className="absolute bottom-6 right-6 text-xs text-slate-400 select-none">
          scroll →
        </div>
      </div>
    </div>
  );
}
