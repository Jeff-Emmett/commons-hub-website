import Link from "next/link";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Visit",
    links: [
      { label: "Accommodation", href: "/accommodation" },
      { label: "Event Venue", href: "/event-venue" },
      { label: "Event Toolbox", href: "/event-toolbox" },
    ],
  },
  {
    heading: "Discover",
    links: [
      { label: "Events", href: "/events" },
      { label: "Blog", href: "/blog" },
      { label: "About", href: "/about" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "Sponsors", href: "/category/sponsors" },
      { label: "Partners", href: "/category/partners" },
      { label: "Impressum", href: "/page/impressum" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-6xl mx-auto px-8 py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div>
          <p className="text-white text-lg font-semibold">Commons Hub</p>
          <p className="mt-3 text-sm leading-relaxed">
            A communal guesthouse &amp; events venue in the Austrian Alps.
          </p>
          <a
            href="mailto:office@commons-hub.at"
            className="mt-3 inline-block text-sm text-white hover:underline"
          >
            office@commons-hub.at
          </a>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <p className="text-white text-sm font-semibold uppercase tracking-wide mb-3">
              {col.heading}
            </p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-8 py-5 text-xs text-slate-500">
          © {new Date().getFullYear()} Commons Hub · Reichenau an der Rax, Austria
        </div>
      </div>
    </footer>
  );
}
