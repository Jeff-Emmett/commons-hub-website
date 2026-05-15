import Image from 'next/image';
import Link from 'next/link';

export interface NavTilesProps {
  upcomingEventImage?: string | null;
  upcomingEventTitle?: string | null;
  upcomingEventSlug?: string | null;
}

interface Tile {
  label: string;
  href: string;
  imageUrl?: string | null;
  imageAlt?: string;
  subline?: string;
}

// Default images for the three static tiles, pulled from Directus
// (these UUIDs are the existing "LODGING", "EVENT HOSTING" and
// "HIKING & CLIMBING" accordion item images). Replace via Directus
// admin if you'd like a different photo per tile.
const DIRECTUS_ASSET_BASE = (
  process.env.NEXT_PUBLIC_DIRECTUS_URL || "https://admin.commons-hub.at"
).replace(/\/$/, "");

const TILE_ACCOMMODATION = `${DIRECTUS_ASSET_BASE}/assets/496f4b23-4e16-47f7-a508-5c270e7aaea2`;
const TILE_EVENTS = `${DIRECTUS_ASSET_BASE}/assets/f6e38335-40a6-4b4c-bfc3-6471c067c38f`;
const TILE_ABOUT = `${DIRECTUS_ASSET_BASE}/assets/5c842eca-49ad-4afc-b48d-f90734bd0f2a`;

export function NavTiles({
  upcomingEventImage,
  upcomingEventTitle,
  upcomingEventSlug,
}: NavTilesProps) {
  const tiles: Tile[] = [
    {
      label: 'Book your Stay',
      href: '/booking/stay',
      imageUrl: TILE_ACCOMMODATION,
      imageAlt: 'Accommodation at the Commons Hub',
    },
    {
      label: 'Plan an Event',
      href: '/booking/event-hosting',
      imageUrl: TILE_EVENTS,
      imageAlt: 'Event venue at the Commons Hub',
    },
    {
      label: 'Upcoming Events',
      href: upcomingEventSlug ? `/events/${upcomingEventSlug}` : '/page/events',
      imageUrl: upcomingEventImage,
      imageAlt: upcomingEventTitle ?? 'Upcoming event',
      subline: upcomingEventTitle ?? undefined,
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
            {tile.subline && (
              <p className="text-white/80 text-sm mt-1 truncate">{tile.subline}</p>
            )}
          </div>
        </Link>
      ))}
    </section>
  );
}
