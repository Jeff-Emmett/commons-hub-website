'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PresentationScroll, type JourneySection } from '@/components/journey/PresentationScroll';
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
  const sections: JourneySection[] = [
    // ── Section 1 — Hero: image 2/3 (full height), text 1/3 (large) ──
    {
      steps: Math.max(1, slides.length),
      render: (step) => (
        <div className="flex flex-col md:flex-row h-full w-full">
          <div className="relative md:w-2/3 h-1/2 md:h-full bg-slate-100">
            {slides.map((s, i) => (
              <Image
                key={i}
                src={s.imageUrl}
                alt=""
                fill
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover transition-opacity duration-700"
                style={{ opacity: i === step ? 1 : 0 }}
              />
            ))}
          </div>
          <div className="md:w-1/3 h-1/2 md:h-full flex items-center px-8 md:px-12">
            <div
              key={step}
              className="text-2xl md:text-3xl lg:text-4xl font-light leading-snug text-slate-900 home-hero-copy"
              dangerouslySetInnerHTML={{ __html: slides[step]?.body ?? '' }}
            />
          </div>
        </div>
      ),
    },

    // ── Section 2 — 2×2 wide tiles, white bg, generous whitespace ──
    {
      steps: 1,
      render: () => (
        <div className="h-full w-full bg-white flex items-center justify-center px-8 md:px-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12 w-full max-w-5xl">
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
        </div>
      ),
    },

    // ── Section 3 — latest 2 blog tiles + newsletter ──
    {
      steps: 1,
      scrollable: true,
      render: () => (
        <div className="min-h-full w-full bg-white px-8 md:px-16 py-12 flex flex-col">
          <div className="max-w-5xl mx-auto w-full flex-1">
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
        </div>
      ),
    },
  ];

  return <PresentationScroll sections={sections} autoplayMs={10000} />;
}
