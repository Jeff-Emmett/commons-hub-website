import ClientSideRout from "@/components/ClientSideRout";

export const metadata = {
  title: "Event Organizer Toolbox | Commons Hub",
  description:
    "Free templates and tools for organizing events at the commons hub — coming soon.",
};

export default function EventToolboxPage() {
  return (
    <main className="page-sections">
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <h1 className="h1 mb-6">Event Organizer Toolbox</h1>
        <p className="text-lg">
          Nothing to see yet, but expect this stuff soon:
        </p>
        <ul className="mt-6 space-y-4 list-disc pl-6 text-lg">
          <li>
            <strong>Templates</strong> — calculation sheet, roadmap &amp;
            timeline, communication templates
          </li>
          <li>
            <strong>Trusted Service Providers</strong> — design, recording,
            photography, etc.
          </li>
          <li>
            <strong>Community Engagement Strategies &amp; Tools</strong> —
            Forum / Wiki
          </li>
          <li>
            <strong>Facilitation Tools</strong> — Open Space Technology //
            Liberating Structures // Event Teams // Awareness Protocol
          </li>
        </ul>
        <p className="mt-8 text-slate-600">
          We&apos;ll likely summarize all of this into a blog post linking out
          to the individual items.
        </p>
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
