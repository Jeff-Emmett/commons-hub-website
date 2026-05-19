'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRegisterLiveCarousel } from '@/lib/contexts/CarouselVisibilityContext';

export interface PinnedSlide {
  imageUrl: string;
  /** Optional per-slide sub-title (e.g. "Lounge"). */
  title?: string;
  /** Rendered to the right of the image (verbatim HTML). */
  body: string;
}

interface PinnedCarouselProps {
  slides: PinnedSlide[];
  /** Optional fixed headline shown above the body on every slide. */
  headline?: string;
  /** ms between auto-advances; 0 disables autoplay. Default 5000. */
  autoplayMs?: number;
  /** ms input is ignored after a step (debounces trackpad inertia). */
  stepLockMs?: number;
  /** Footer/extra node rendered inside the right text column (last slide). */
  children?: ReactNode;
}

/**
 * Sticky single-viewport carousel. One scroll-tick / arrow-key / swipe =
 * one slide step. Autoplay advances every {autoplayMs} until the user
 * interacts. When at a boundary in the requested direction, input passes
 * through so normal page scrolling resumes into the next section.
 */
export function PinnedCarousel({
  slides,
  headline,
  autoplayMs = 5000,
  stepLockMs = 450,
}: PinnedCarouselProps) {
  const n = Math.max(1, slides.length);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const userInteractedRef = useRef(false);
  const lockUntilRef = useRef(0);

  // Hide the global left social sidebar while this is on screen.
  useRegisterLiveCarousel(inView);

  // In-view tracking: scopes wheel/keyboard handlers and sidebar hiding to
  // this section. Threshold 0.4 so we activate once the section dominates
  // the viewport, not as soon as a pixel pokes in.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /** Try to advance by dir; returns true if the index changed. */
  const step = useCallback(
    (dir: 1 | -1): boolean => {
      const now = Date.now();
      if (now < lockUntilRef.current) return false;
      let stepped = false;
      setIndex((cur) => {
        const next = cur + dir;
        if (next < 0 || next >= n) return cur;
        stepped = true;
        lockUntilRef.current = Date.now() + stepLockMs;
        return next;
      });
      return stepped;
    },
    [n, stepLockMs],
  );

  // Wheel: one gesture = one step. Pass through at boundaries so the page
  // can continue scrolling into the next section.
  useEffect(() => {
    if (!inView) return;
    const onWheel = (e: WheelEvent) => {
      const dir: 1 | -1 | 0 = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
      if (dir === 0) return;
      if ((dir === 1 && index === n - 1) || (dir === -1 && index === 0)) return;
      e.preventDefault();
      if (step(dir)) userInteractedRef.current = true;
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [inView, index, n, step]);

  // Keyboard: Down/Right/PageDown/Space = next; Up/Left/PageUp = prev.
  useEffect(() => {
    if (!inView) return;
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack typing in form fields.
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }
      let dir: 1 | -1 | 0 = 0;
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowRight' ||
        e.key === 'PageDown' ||
        e.key === ' '
      ) {
        dir = 1;
      } else if (
        e.key === 'ArrowUp' ||
        e.key === 'ArrowLeft' ||
        e.key === 'PageUp'
      ) {
        dir = -1;
      }
      if (dir === 0) return;
      if ((dir === 1 && index === n - 1) || (dir === -1 && index === 0)) return;
      e.preventDefault();
      if (step(dir)) userInteractedRef.current = true;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inView, index, n, step]);

  // Touch swipe: ~40px threshold; dominant axis decides direction.
  // Swipe up or left → next; swipe down or right → prev (matches arrow mapping).
  useEffect(() => {
    if (!inView) return;
    const el = wrapRef.current;
    if (!el) return;
    let startY = 0;
    let startX = 0;
    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    };
    const onEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dy = t.clientY - startY;
      const dx = t.clientX - startX;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (Math.max(adx, ady) < 40) return;
      const dir: 1 | -1 = (ady > adx ? -dy : -dx) > 0 ? 1 : -1;
      if ((dir === 1 && index === n - 1) || (dir === -1 && index === 0)) return;
      if (step(dir)) userInteractedRef.current = true;
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  }, [inView, index, n, step]);

  // Autoplay — only while in view and the user hasn't interacted yet.
  // Stops at the last slide (so the page doesn't endlessly tick).
  useEffect(() => {
    if (!autoplayMs || !inView || userInteractedRef.current) return;
    const id = window.setInterval(() => {
      setIndex((cur) => {
        if (cur >= n - 1) {
          window.clearInterval(id);
          return cur;
        }
        return cur + 1;
      });
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [autoplayMs, inView, n]);

  return (
    <section
      ref={wrapRef}
      className="pinned-carousel relative w-full overflow-hidden bg-white"
      style={{ height: 'calc(100vh - 5rem)' }}
    >
      <div
        className="flex h-full"
        style={{
          width: `${n * 100}%`,
          transform: `translateX(-${(index / n) * 100}%)`,
          transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
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
                  <p className="text-sm uppercase tracking-widest text-slate-500 mb-4">
                    {headline}
                  </p>
                )}
                {s.title && (
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-medium text-slate-900 mb-4">
                    {s.title}
                  </h3>
                )}
                <div
                  className="text-xl md:text-2xl lg:text-3xl font-normal leading-snug text-slate-800 home-hero-copy"
                  dangerouslySetInnerHTML={{ __html: s.body }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slide progress dots — also clickable for direct jumping */}
      {n > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                userInteractedRef.current = true;
                lockUntilRef.current = Date.now() + stepLockMs;
                setIndex(i);
              }}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i === index
                  ? 'bg-slate-900'
                  : 'bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      )}

      {/* Hint */}
      <div className="absolute bottom-6 right-6 text-xs text-slate-400 select-none pointer-events-none">
        scroll, swipe, or use arrows →
      </div>
    </section>
  );
}
