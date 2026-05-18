'use client';

import { useEffect, useState } from 'react';

// Containers whose images should be click-to-expand.
const SCOPES = [
  '.scroll-block-element',
  '.about-bio',
  '.post-detail',
  '.summary',
  '.prose',
];

/**
 * Global lightbox: any image inside rendered CMS content becomes a
 * clickable tile that expands to a full-screen view. No change to the
 * stored HTML — purely a viewer enhancement.
 */
export default function ContentLightbox() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t || t.tagName !== 'IMG') return;
      if (!SCOPES.some((sel) => t.closest(sel))) return;
      const img = t as HTMLImageElement;
      if (!img.currentSrc && !img.src) return;
      e.preventDefault();
      setSrc(img.currentSrc || img.src);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSrc(null);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!src) return null;
  return (
    <div
      onClick={() => setSrc(null)}
      className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-6 cursor-zoom-out"
      role="dialog"
      aria-modal="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
      />
      <button
        type="button"
        onClick={() => setSrc(null)}
        aria-label="Close"
        className="absolute top-5 right-6 text-white/80 hover:text-white text-3xl leading-none"
      >
        ×
      </button>
    </div>
  );
}
