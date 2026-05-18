'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export interface EventCard {
  slug: string;
  title: string;
  dateLabel: string;
  imageUrl: string | null;
}

/**
 * Shows events three-across; the middle card is enlarged/centered.
 * Prev/Next page through the list in steps of three (spec).
 */
export function EventRow({ events }: { events: EventCard[] }) {
  const [page, setPage] = useState(0);
  if (events.length === 0) {
    return <p className="text-slate-500">Nothing here yet — check back soon.</p>;
  }
  const pages = Math.ceil(events.length / 3);
  const group = events.slice(page * 3, page * 3 + 3);
  // Pad to 3 so the middle slot stays centered.
  while (group.length < 3 && events.length >= 3) group.push(group[group.length - 1]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {group.map((ev, i) => {
          const isMiddle = i === 1;
          return (
            <Link
              key={`${ev.slug}-${i}`}
              href={`/events/${ev.slug}`}
              className={`group block ${
                isMiddle ? 'md:scale-110 md:z-10' : 'md:scale-95 md:opacity-90'
              } transition-transform duration-300`}
            >
              <div
                className="relative overflow-hidden rounded-xl bg-slate-200"
                style={{ aspectRatio: '16 / 9' }}
              >
                {ev.imageUrl && (
                  <Image
                    src={ev.imageUrl}
                    alt={ev.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>
              <h3
                className={`mt-3 font-semibold leading-tight ${
                  isMiddle ? 'text-xl' : 'text-lg'
                }`}
              >
                {ev.title}
              </h3>
              <p className="text-sm text-slate-500">{ev.dateLabel}</p>
            </Link>
          );
        })}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-6 mt-6">
          <button
            type="button"
            onClick={() => setPage((p) => (p - 1 + pages) % pages)}
            className="text-slate-600 hover:text-slate-900 text-sm font-medium"
            aria-label="Previous events"
          >
            ← Prev
          </button>
          <span className="text-sm text-slate-500 tabular-nums">
            {page + 1} / {pages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => (p + 1) % pages)}
            className="text-slate-600 hover:text-slate-900 text-sm font-medium"
            aria-label="Next events"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
