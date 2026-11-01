import SiteFooter from "@/components/SiteFooter";
import { getPageContent, itemEdit, pageMetadata, sectionEdit } from "@/lib/cms/content";

// Content: Directus → Pages → "Event Organizer Toolbox" → Sections (intro,
// items = the bullet list, outro).
export function generateMetadata() {
  return pageMetadata("event-toolbox", {
    title: "Event Organizer Toolbox",
    description:
      "Free templates and tools for organizing events at the commons hub — coming soon.",
  });
}

export default async function EventToolboxPage() {
  const page = await getPageContent("event-toolbox");
  const { intro, items, outro } = page?.sections ?? {};

  return (
    <main className="page-sections">
      <section className="px-6 py-20 max-w-3xl mx-auto">
        {intro && (
          <>
            <h1 className="h1 mb-6" {...sectionEdit(intro)}>{intro.heading}</h1>
            <p className="text-lg" dangerouslySetInnerHTML={{ __html: intro.text }} />
          </>
        )}
        {items && (
          <ul className="mt-6 space-y-4 list-disc pl-6 text-lg" {...sectionEdit(items)}>
            {items.items.map((i) => (
              <li key={i.id} {...itemEdit(i)}>
                <strong>{i.title}</strong> — <span dangerouslySetInnerHTML={{ __html: i.text }} />
              </li>
            ))}
          </ul>
        )}
        {outro && (
          <p
            className="mt-8 text-slate-600"
            {...sectionEdit(outro)}
            dangerouslySetInnerHTML={{ __html: outro.text }}
          />
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
