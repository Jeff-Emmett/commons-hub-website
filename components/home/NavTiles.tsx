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

// Placeholder image paths for the three static tiles. Drop a real
// 1:1 jpg/webp at each path in /public/images/ to fill them in; until
// then the tile falls back to a slate background.
const TILE_ACCOMMODATION = "/images/tile-accommodation.jpg";
const TILE_EVENTS = "/images/tile-events.jpg";
const TILE_ABOUT = "/images/tile-about.jpg";

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
