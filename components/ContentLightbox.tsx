'use client';

import { useCallback, useEffect, useState } from 'react';

// Containers whose images should be click-to-expand.
const SCOPES = [
  '.scroll-block-element',
  '.about-bio',
  '.post-detail',
  '.summary',
  '.prose',
  '.gallery-grid',
];

function srcOf(el: HTMLImageElement): string {
  // Prefer a full-resolution original (data-full) when a tile exposes one —
  // grid thumbnails are served at ~360px and would otherwise open upscaled.
  return el.dataset.full || el.currentSrc || el.src || '';
}

/**
 * Global lightbox: any image inside rendered CMS content becomes a
 * clickable tile that expands to a full-screen view. Clicking one photo
 * captures every sibling image in the same container, so the viewer can
 * arrow (←/→) through the whole set — e.g. a gallery. No change to the
 * stored HTML — purely a viewer enhancement.
 */
export default function ContentLightbox() {
  const [list, setList] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  const close = useCallback(() => setList([]), []);
  // Index is wrapped into range at render time, so ← from the first photo
  // lands on the last and → from the last wraps to the first.
  const go = useCallback((delta: number) => {
    setIndex((i) => i + delta);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t || t.tagName !== 'IMG') return;
      const container = SCOPES.map((sel) => t.closest(sel)).find(Boolean);
      if (!container) return;
      const img = t as HTMLImageElement;
      if (!srcOf(img)) return;
      e.preventDefault();
      // Every lightbox-eligible image in the same container, in DOM order.
      const imgs = Array.from(
        (container as Element).querySelectorAll('img'),
      ).filter((el) => srcOf(el as HTMLImageElement));
      const srcs = imgs.map((el) => srcOf(el as HTMLImageElement));
      const at = imgs.indexOf(img);
      setList(srcs.length ? srcs : [srcOf(img)]);
      setIndex(at >= 0 ? at : 0);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (list.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        go(-1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [list.length, close, go]);

  if (list.length === 0) return null;
  // Wrap index into range (handles the unbounded +/- from `go`).
  const n = list.length;
  const i = ((index % n) + n) % n;
  const src = list[i];
  const multi = n > 1;

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-6 cursor-zoom-out"
      role="dialog"
      aria-modal="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-full max-w-full object-contain rounded-lg shadow-2xl cursor-default"
      />

      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className="absolute top-5 right-6 text-white/80 hover:text-white text-3xl leading-none"
      >
        ×
      </button>

      {multi && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Previous photo"
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white text-4xl leading-none select-none"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Next photo"
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white text-4xl leading-none select-none"
          >
            ›
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 text-sm select-none">
            {i + 1} / {n}
          </div>
        </>
      )}
    </div>
  );
}
