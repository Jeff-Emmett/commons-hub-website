'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PinnedCarousel } from '@/components/journey/PinnedCarousel';
import NewsletterSignup from '@/components/NewsletterSignup';
import SiteFooter from '@/components/SiteFooter';
import type { EditAttr } from '@/lib/directus/editAttr';

export interface HomeSlide {
  imageUrl: string;
  body: string; // verbatim CMS HTML
}
export interface HomeTile {
  label: string;
  href: string;
  imageUrl: string | null;
  editAttr?: EditAttr;
}
export interface HomePost {
  title: string;
  slug: string;
  imageUrl: string | null;
}
export interface HomePhoto {
  imageUrl: string;
}

interface HomeJourneyProps {
  slides: HomeSlide[];
  tiles: HomeTile[];
  tilesEdit?: EditAttr;
  posts: HomePost[];
  /** Blog row heading (Directus section home/blog); undefined hides the row. */
  blog?: { heading: string; editAttr?: EditAttr };
  galleryPreview?: HomePhoto[];
  /** Gallery preview heading + link (section home/gallery_preview). */
  gallery?: { heading: string; linkLabel: string; href: string; editAttr?: EditAttr };
}

export function HomeJourney({
  slides,
  tiles,
  tilesEdit,
  posts,
  blog,
  galleryPreview = [],
  gallery,
}: HomeJourneyProps) {
  const tr = useTranslations('home');
  return (
    <main className="home">
      {/* Section 1 — scroll-pinned hero: scroll pans slides right→left,
          then normal page scroll resumes below. */}
      {slides.length > 0 && <PinnedCarousel slides={slides} />}

      {/* Section 2 — 2×2 wide tiles, white bg, generous whitespace */}
      {tiles.length > 0 && (
      <section className="bg-white px-8 md:px-16 py-20" {...tilesEdit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12 w-full max-w-5xl mx-auto">
          {tiles.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className="group relative block w-full overflow-hidden rounded-xl bg-slate-100"
              style={{ aspectRatio: '16 / 9' }}
              aria-label={t.label}
              {...t.editAttr}
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
      )}

      {/* Section 3 — all published blog posts (scrollable) + newsletter */}
      <section className="bg-white px-8 md:px-16 py-16">
        <div className="max-w-5xl mx-auto w-full">
          {blog && (
            <h2 className="text-2xl font-semibold mb-6" {...blog.editAttr}>{blog.heading}</h2>
          )}
          {blog && posts.length > 0 && (
            <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-2 px-2">
              {posts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/post/${p.slug}`}
                  className="group block shrink-0 w-72 sm:w-80 snap-start overflow-hidden rounded-xl bg-slate-100 hover:shadow-lg transition-shadow"
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
                        sizes="320px"
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
          )}

          <div className="mt-12 border-t border-gray-100 pt-8 text-center">
            <NewsletterSignup compact center />
          </div>
        </div>

      </section>

      {/* Section 4 — gallery preview, links through to /gallery */}
      {gallery && galleryPreview.length > 0 && (
        <section className="bg-white px-8 md:px-16 pb-20" {...gallery.editAttr}>
          <div className="max-w-5xl mx-auto w-full">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl font-semibold">{gallery.heading}</h2>
              <Link
                href={gallery.href}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 underline underline-offset-4"
              >
                {gallery.linkLabel}
              </Link>
            </div>
            <Link
              href={gallery.href}
              aria-label={tr('galleryAria')}
              className="group grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3"
            >
              {galleryPreview.map((p, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-lg bg-slate-100"
                  style={{ aspectRatio: '1 / 1' }}
                >
                  <Image
                    src={p.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 240px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
            </Link>
          </div>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}
