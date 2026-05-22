import { getGalleryCarousels } from "@/lib/actions/getCarousels";
import { CarouselOrGallery } from "@/components/CarouselOrGallery";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Gallery | Commons Hub",
  description:
    "Photos from the Commons Hub — the house, the common spaces, the people, and life in the Austrian Alps.",
};

// Gallery content is CMS-driven: each Directus carousel titled
// "gallery: ..." becomes a masonry section here. Render at request time so
// new photos appear without a redeploy.
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const galleries = await getGalleryCarousels();

  return (
    <main className="page-sections">
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <h1 className="h1 mb-2">Gallery</h1>
        <p className="text-slate-600 mb-6">
          A look around the Commons Hub — the house, the common spaces, and
          life in the valley. Click any photo to enlarge.
        </p>
        {galleries.length === 0 ? (
          <p className="text-slate-500">Photos coming soon.</p>
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
