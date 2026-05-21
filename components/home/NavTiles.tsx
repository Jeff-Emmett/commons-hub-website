import Image from 'next/image';
import Link from 'next/link';

export interface NavTilesProps {
  upcomingEventImage?: string | null;
  upcomingEventTitle?: string | null;
}

interface Tile {
  label: string;
  href: string;
  imageUrl?: string | null;
  imageAlt?: string;
}

// Default images for the three static tiles, pulled from Directus
// (these UUIDs are the existing "LODGING", "EVENT HOSTING" and
// "HIKING & CLIMBING" accordion item images). Replace via Directus
// admin if you'd like a different photo per tile.
const DIRECTUS_ASSET_BASE = (
  process.env.NEXT_PUBLIC_DIRECTUS_URL || "https://admin.commons-hub.at"
).replace(/\/$/, "");

const TILE_ACCOMMODATION = `${DIRECTUS_ASSET_BASE}/assets/dfa256d9-8691-4491-aeeb-e21150921494`;
const TILE_EVENTS = `${DIRECTUS_ASSET_BASE}/assets/7ec81ee4-28e4-40fe-ad00-f1fe0e4ddbbc`;
const TILE_ABOUT = `${DIRECTUS_ASSET_BASE}/assets/728e404d-4a88-4ce2-b623-1654d21cfef9`;

export function NavTiles({
  upcomingEventImage,
  upcomingEventTitle,
}: NavTilesProps) {
  const tiles: Tile[] = [
    {
      label: 'Book your Stay',
      href: '/accommodation',
      imageUrl: TILE_ACCOMMODATION,
      imageAlt: 'Accommodation at the Commons Hub',
    },
    {
      label: 'Plan your Retreat',
      href: '/event-venue',
      imageUrl: TILE_EVENTS,
      imageAlt: 'Event venue at the Commons Hub',
    },
    {
      // Always the Events page (spec) — only the photo comes from the next event.
      label: 'Upcoming Events',
      href: '/events',
      imageUrl: upcomingEventImage,
      imageAlt: upcomingEventTitle ?? 'Upcoming event',
    },
    {
      label: 'Read More',
      href: '/page/about',
      imageUrl: TILE_ABOUT,
      imageAlt: 'About the Commons Hub',
    },
  ];

  return (
    <section className="nav-tiles grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
      {tiles.map((tile) => (
        <Link
          key={tile.label}
          href={tile.href}
          className="group relative block aspect-square overflow-hidden rounded-xl bg-slate-100"
          aria-label={tile.label}
        >
          {tile.imageUrl ? (
            <Image
              src={tile.imageUrl}
              alt={tile.imageAlt ?? tile.label}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-slate-200" />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-white text-lg font-semibold tracking-wide uppercase">
              {tile.label}
            </p>
          </div>
        </Link>
      ))}
    </section>
  );
}
