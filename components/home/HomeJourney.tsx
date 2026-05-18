'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PinnedCarousel } from '@/components/journey/PinnedCarousel';
import NewsletterSignup from '@/components/NewsletterSignup';

export interface HomeSlide {
  imageUrl: string;
  body: string; // verbatim CMS HTML
}
export interface HomeTile {
  label: string;
  href: string;
  imageUrl: string | null;
}
export interface HomePost {
  title: string;
  slug: string;
  imageUrl: string | null;
}

interface HomeJourneyProps {
  slides: HomeSlide[];
  tiles: HomeTile[];
  posts: HomePost[];
}

export function HomeJourney({ slides, tiles, posts }: HomeJourneyProps) {
  return (
    <main className="home">
      {/* Section 1 — scroll-pinned hero: scroll pans slides right→left,
          then normal page scroll resumes below. */}
      {slides.length > 0 && <PinnedCarousel slides={slides} />}

      {/* Section 2 — 2×2 wide tiles, white bg, generous whitespace */}
      <section className="bg-white px-8 md:px-16 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12 w-full max-w-5xl mx-auto">
          {tiles.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className="group relative block w-full overflow-hidden rounded-xl bg-slate-100"
              style={{ aspectRatio: '16 / 9' }}
              aria-label={t.label}
            >
              {t.imageUrl ? (
                <Image
                  src={t.imageUrl}
                  alt={t.label}
                  fill
                  sizes="(max-width: 640px) 100vw, 40vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-slate-200" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                <p className="text-white text-xl font-semibold tracking-wide uppercase">
                  {t.label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Section 2b — more about the Hub, with links out */}
      <section className="bg-white px-8 md:px-16 py-16 border-t border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-xl font-semibold mb-2">Stay with us</h3>
            <p className="text-slate-600 mb-3">
              A communal guesthouse, not a hotel — rooms, shared common areas,
              and space to slow down in the Austrian Alps.
            </p>
            <Link href="/accommodation" className="text-slate-900 font-medium hover:underline">
              Accommodation →
            </Link>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Host an event</h3>
            <p className="text-slate-600 mb-3">
              Halls, a maker space and seminar room for gatherings from intimate
              retreats to week-long conferences.
            </p>
            <Link href="/event-venue" className="text-slate-900 font-medium hover:underline">
              Event Venue →
            </Link>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Join the community</h3>
            <p className="text-slate-600 mb-3">
              Artists, dreamers, hackers and tinkerers — plus the events,
              partners and history behind the Hub.
            </p>
            <Link href="/page/community" className="text-slate-900 font-medium hover:underline">
              Community &amp; About →
            </Link>
          </div>
        </div>
      </section>

      {/* Section 3 — latest 2 blog tiles + newsletter */}
      <section className="bg-white px-8 md:px-16 py-16">
        <div className="max-w-5xl mx-auto w-full">
          <h2 className="text-2xl font-semibold mb-6">Latest from the blog</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {posts.slice(0, 2).map((p) => (
              <Link
                key={p.slug}
                href={`/post/${p.slug}`}
                className="group block overflow-hidden rounded-xl bg-slate-100 hover:shadow-lg transition-shadow"
              >
                <div
                  className="relative bg-slate-200"
                  style={{ aspectRatio: '16 / 9' }}
                >
                  {p.imageUrl && (
                    <Image
                      src={p.imageUrl}
                      alt={p.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 40vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold leading-tight">{p.title}</h3>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 border-t border-gray-100 pt-8">
            <NewsletterSignup compact />
          </div>
        </div>

        <footer className="footer mt-12">
          <div className="footer-wrapper">
            <div className="footer-bottom">
              <div className="bottom-details">
                <p className="bottom-link inline"> Commons Hub</p>
              </div>
              <div className="bottom-details">
                <Link href="/page/impressum" aria-label="Impressum">
                  <p className="bottom-link">Impressum</p>
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
