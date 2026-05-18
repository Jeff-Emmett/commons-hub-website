'use client';

import { useEffect, useState } from 'react';

interface Item {
  id: string;
  label: string;
}

function slugify(s: string, i: number) {
  const base = s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);
  return base ? `sec-${base}` : `sec-${i}`;
}

/**
 * Left index built from the H2/H3 headings already inside a rendered
 * CMS content container. Assigns ids, scroll-spies, smooth-scrolls.
 * Renders nothing if there are fewer than 2 headings (no useful index).
 */
export function AutoSectionNav({ containerId }: { containerId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState('');

  useEffect(() => {
    const root = document.getElementById(containerId);
    if (!root) return;
    const heads = Array.from(
      root.querySelectorAll<HTMLElement>('h1, h2, h3'),
    ).filter((h) => (h.textContent ?? '').trim().length > 0);

    const found: Item[] = heads.map((h, i) => {
      if (!h.id) h.id = slugify(h.textContent ?? '', i);
      h.style.scrollMarginTop = '7rem';
      return { id: h.id, label: (h.textContent ?? '').trim() };
    });
    if (found.length < 2) {
      setItems([]);
      return;
    }
    setItems(found);
    setActive(found[0].id);

    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.5, 1] },
    );
    heads.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, [containerId]);

  if (items.length === 0) return null;

  return (
    <nav className="hidden md:block w-44 shrink-0">
      <div className="sticky top-28 space-y-1">
        {items.map((s) => (
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
