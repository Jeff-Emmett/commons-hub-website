import { getHomePage } from "@/lib/actions/getHomePage";
import { getAllPublishedPosts } from "@/lib/actions/getPost";
import { getEventPage } from "@/lib/actions/getEventPage";
import { readSingleton } from "@/lib/directus/client";
import { HeroCarousel, type HeroSlide } from "@/components/home/HeroCarousel";
import { NavTiles } from "@/components/home/NavTiles";
import PostGrid from "@/components/PostGrid";
import NewsletterSignup from "@/components/NewsletterSignup";
import ClientSideRout from "@/components/ClientSideRout";

const DIRECTUS_ASSET_BASE = (
  process.env.NEXT_PUBLIC_DIRECTUS_URL || "https://admin.commons-hub.at"
).replace(/\/$/, "");

interface CarouselSlideRow {
  id: number;
  image: string | null;
  quote: string | null;
}
interface NamedCarousel {
  id: number;
  title: string | null;
  carousel_items?: CarouselSlideRow[];
}

const SPEC_FALLBACK_SLIDES: HeroSlide[] = [
  {
    imageUrl: "/images/hero-1.jpg",
    body: "<p>Welcome to the <strong>Commons Hub</strong> — a communal guesthouse and events venue in the Austrian Alps, one hour south of Vienna.</p>",
  },
  {
    imageUrl: "/images/hero-2.jpg",
    body: "<p>The Commons Hub harbours artists, dreamers, hackers and tinkerers weaving sustainable perspectives across technology, economy, society and nature.</p>",
  },
  {
    imageUrl: "/images/hero-3.jpg",
    body: "<p><em>Laid back, but intentional. Minimal formalities. Maximum freedom.</em></p>",
  },
  {
    imageUrl: "/images/hero-4.jpg",
    body: "<p>Stay a night, host a gathering, or drop in for one of our events. The garden, the fire bowl and the kitchen are open.</p>",
  },
];

async function loadHeroSlides(fallbackImage?: string | null): Promise<HeroSlide[]> {
  const carousel = await readSingleton<NamedCarousel>("carousels", {
    fields: ["id", "title", "carousel_items.id", "carousel_items.image", "carousel_items.quote"],
    filter: { title: { _eq: "home_hero" } },
  });

  if (carousel?.carousel_items && carousel.carousel_items.length > 0) {
    return carousel.carousel_items.slice(0, 4).map((item) => ({
      imageUrl: item.image
        ? `${DIRECTUS_ASSET_BASE}/assets/${item.image}`
        : fallbackImage
        ? `${DIRECTUS_ASSET_BASE}/assets/${fallbackImage}`
        : "/images/hero-1.jpg",
      body: item.quote ?? "",
    }));
  }

  // No CMS carousel yet — use the spec defaults, swapping in the page's
  // main_image (if any) as a single visual until editors add a "home_hero"
  // carousel with 4 slides.
  if (fallbackImage) {
    const fallbackUrl = `${DIRECTUS_ASSET_BASE}/assets/${fallbackImage}`;
    return SPEC_FALLBACK_SLIDES.map((s) => ({ ...s, imageUrl: fallbackUrl }));
  }
  return SPEC_FALLBACK_SLIDES;
}

export default async function Home() {
  const [page, posts, upcoming] = await Promise.all([
    getHomePage(),
    getAllPublishedPosts(),
    getEventPage("upcoming"),
  ]);

  const slides = await loadHeroSlides(page?.main_image ?? null);
  const nextEvent = upcoming[0];

  return (
    <main className="home">
      <HeroCarousel slides={slides} />

      <NavTiles
        upcomingEventImage={
          nextEvent?.main_image
            ? `${DIRECTUS_ASSET_BASE}/assets/${nextEvent.main_image}`
            : null
        }
        upcomingEventTitle={nextEvent?.title ?? null}
      />

      {posts.length > 0 && (
        <section className="latest-posts p-6">
          <h2 className="text-2xl font-semibold mb-4 px-2">Latest from the blog</h2>
          <PostGrid posts={posts.slice(0, 2)} />
        </section>
      )}

      <section id="newsletter" className="p-6">
        <NewsletterSignup />
      </section>

      <footer className="footer">
        <div className="footer-wrapper">
          <div className="footer-bottom">
            <div className="bottom-details">
              <p className="bottom-link inline"> Commons Hub</p>
            </div>
            <div className="bottom-details">
              <ClientSideRout route={`/page/impressum`} ariaLabel="Impressum">
                <p className="bottom-link">Impressum</p>
              </ClientSideRout>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
