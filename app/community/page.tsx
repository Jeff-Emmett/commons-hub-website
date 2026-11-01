import Link from "next/link";
import Image from "next/image";
import SiteFooter from "@/components/SiteFooter";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import {
  assetUrl,
  getPageContent,
  itemEdit,
  pageMetadata,
  sectionEdit,
  type SectionItem,
} from "@/lib/cms/content";

// Content: Directus → Pages → "Community & Partners" → Sections (intro,
// associations, partners, cta). Each card is a section item: title, text,
// link (empty = not clickable) and image (the logo; empty = placeholder).
export function generateMetadata() {
  return pageMetadata("community-partners", {
    title: "Community",
    description:
      "The associations based at the Commons Hub and the network of partner spaces we work with.",
  });
}

function EntityCard({ entity }: { entity: SectionItem }) {
  const url = assetUrl(entity.image);
  const body = (
    <div className="flex h-full flex-col gap-3">
      <div className="relative h-16 w-16">
        {url ? (
          <Image
            src={url}
            alt={entity.image_alt || entity.title}
            fill
            sizes="64px"
            className="object-contain"
          />
        ) : (
          <PlaceholderImage label="Logo" aspect="aspect-square" />
        )}
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">
          {entity.title}
          {entity.link && <span className="text-slate-400"> ↗</span>}
        </h3>
        <p className="mt-1 text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: entity.text }} />
      </div>
    </div>
  );

  const cardClass =
    "rounded-lg border border-slate-200 p-5 transition-colors hover:border-slate-400";

  return entity.link ? (
    <a
      href={entity.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`block ${cardClass}`}
      {...itemEdit(entity)}
    >
      {body}
    </a>
  ) : (
    <div className={cardClass} {...itemEdit(entity)}>
      {body}
    </div>
  );
}

export default async function CommunityPage() {
  const page = await getPageContent("community-partners");
  const { intro, associations, partners, cta } = page?.sections ?? {};

  return (
    <main className="page-sections">
      <section className="max-w-6xl mx-auto px-6 py-12">
        {intro && (
          <>
            <h1 className="h1 mb-4" {...sectionEdit(intro)}>{intro.heading}</h1>
            <p className="max-w-3xl text-lg text-slate-700" dangerouslySetInnerHTML={{ __html: intro.text }} />
          </>
        )}

        {/* Local associations hosted at the Hub (spec 4c) */}
        {associations && (
          <>
            <h2 className="h2 mt-14 mb-6" {...sectionEdit(associations)}>{associations.heading}</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {associations.items.map((e) => (
                <EntityCard key={e.id} entity={e} />
              ))}
            </div>
          </>
        )}

        {/* Partner network (spec 4d). No sponsors section by design (spec 4e). */}
        {partners && (
          <>
            <h2 className="h2 mt-14 mb-6" {...sectionEdit(partners)}>{partners.heading}</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {partners.items.map((e) => (
                <EntityCard key={e.id} entity={e} />
              ))}
            </div>
          </>
        )}

        {cta && (
          <div className="mt-14 border-t border-slate-100 pt-8" {...sectionEdit(cta)}>
            <p className="text-slate-600">
              <span dangerouslySetInnerHTML={{ __html: cta.text }} />{" "}
              {cta.button_label && cta.button_link && (
                <Link
                  href={cta.button_link}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {cta.button_label}
                </Link>
              )}
            </p>
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
