import Image from "next/image";
import SiteFooter from "@/components/SiteFooter";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { assetUrl, getPageContent, itemEdit, pageMetadata, sectionEdit } from "@/lib/cms/content";

// Content: Directus → Pages → "Nature & Surroundings" → Sections (intro,
// teasers). Each teaser is a section item; until it has an image, the
// placeholder box shows the item's "hint" (what the photo should show).
export function generateMetadata() {
  return pageMetadata("surroundings", {
    title: "Nature & Surroundings",
    description:
      "The mountains, village and activities around the Commons Hub in Reichenau an der Rax — a teaser into the community wiki.",
  });
}

export default async function SurroundingsPage() {
  const page = await getPageContent("surroundings");
  const { intro, teasers } = page?.sections ?? {};

  return (
    <main className="page-sections">
      <section className="max-w-6xl mx-auto px-6 py-12">
        {intro && (
          <>
            <h1 className="h1 mb-4" {...sectionEdit(intro)}>{intro.heading}</h1>
            <p className="max-w-3xl text-lg text-slate-700" dangerouslySetInnerHTML={{ __html: intro.text }} />
          </>
        )}

        {teasers && (
          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3" {...sectionEdit(teasers)}>
            {teasers.items.map((t) => {
              const img = assetUrl(t.image);
              return (
                <article key={t.id} id={t.anchor ?? undefined} className="scroll-mt-28" {...itemEdit(t)}>
                  {img ? (
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                      <Image
                        src={img}
                        alt={t.image_alt || t.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <PlaceholderImage label={t.hint} />
                  )}
                  <h2 className="h2 mt-5 mb-2">{t.title}</h2>
                  <p className="text-slate-700" dangerouslySetInnerHTML={{ __html: t.text }} />
                  {t.link && (
                    <a
                      href={t.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block font-medium text-slate-900 hover:underline"
                    >
                      {t.link_label || teasers.button_label}
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
