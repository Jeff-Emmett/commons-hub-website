import { getTranslations } from "next-intl/server";
import { getGalleryCarousels } from "@/lib/actions/getCarousels";
import { CarouselOrGallery } from "@/components/CarouselOrGallery";
import SiteFooter from "@/components/SiteFooter";
import { getPageContent, pageMetadata, sectionEdit } from "@/lib/cms/content";

export function generateMetadata() {
  return pageMetadata("gallery", {
    title: "Gallery",
    description:
      "Photos from the Commons Hub — the house, the common spaces, the people, and life in the Austrian Alps.",
  });
}

// Gallery content is CMS-driven: each Directus carousel titled
// "gallery: ..." becomes a masonry section here; the heading and intro are
// Pages → "Gallery" → Sections → intro. Render at request time so new photos
// appear without a redeploy.
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const [galleries, page, t] = await Promise.all([
    getGalleryCarousels(),
    getPageContent("gallery"),
    getTranslations("gallery"),
  ]);
  const intro = page?.sections.intro;

  return (
    <main className="page-sections">
      <section className="px-6 py-12 max-w-6xl mx-auto">
        {intro && (
          <>
            <h1 className="h1 mb-2" {...sectionEdit(intro)}>{intro.heading}</h1>
            <p className="text-slate-600 mb-6" dangerouslySetInnerHTML={{ __html: intro.text }} />
          </>
        )}
        {galleries.length === 0 ? (
          <p className="text-slate-500">{t("empty")}</p>
        ) : (
          galleries.map((carousel) => (
            <CarouselOrGallery key={carousel.id} carousel={carousel} />
          ))
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
