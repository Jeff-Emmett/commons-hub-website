'use client';

import { useEffect, useState } from 'react';

export interface NavSection {
  id: string;
  label: string;
}

/**
 * Sticky left-hand index with scroll-spy. Pages render their content with
 * matching `id`s and `scroll-mt-28`; this highlights the section in view
 * and smooth-scrolls on click. Reused across the site.
 */
export function SectionNav({ sections }: { sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [sections]);

  return (
    <nav className="hidden md:block w-44 shrink-0">
      <div className="sticky top-28 space-y-1">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() =>
              document
                .getElementById(s.id)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              active === s.id
                ? 'bg-slate-900 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
