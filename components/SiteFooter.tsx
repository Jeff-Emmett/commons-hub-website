"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

const COLUMNS: { heading: string; links: { key: string; href: string }[] }[] = [
  {
    heading: "visit",
    links: [
      { key: "accommodation", href: "/accommodation" },
      { key: "eventVenue", href: "/event-venue" },
      { key: "eventToolbox", href: "/event-toolbox" },
    ],
  },
  {
    heading: "discover",
    links: [
      { key: "events", href: "/events" },
      { key: "blog", href: "/blog" },
      { key: "gallery", href: "/gallery" },
      { key: "about", href: "/about" },
    ],
  },
  {
    heading: "community",
    links: [
      { key: "support", href: "/support" },
      { key: "communityPartners", href: "/community" },
      { key: "natureSurroundings", href: "/surroundings" },
      { key: "impressum", href: "/page/impressum" },
    ],
  },
];

export default function SiteFooter() {
  const t = useTranslations();
  return (
    <footer className="bg-white text-slate-600 border-t border-gray-200 mt-16">
      <div className="max-w-6xl mx-auto px-8 py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div>
          <p className="text-slate-900 text-lg font-semibold">Commons Hub</p>
          <p className="mt-3 text-sm leading-relaxed">{t("footer.tagline")}</p>
          <a
            href="mailto:office@commons-hub.at"
            className="mt-3 inline-block text-sm text-slate-900 font-medium hover:underline"
          >
            office@commons-hub.at
          </a>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <p className="text-slate-900 text-sm font-semibold uppercase tracking-wide mb-3">
              {t(`footer.${col.heading}`)}
            </p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm hover:text-slate-900 transition-colors"
                  >
                    {t(`links.${l.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-5 text-xs text-slate-500">
          © {new Date().getFullYear()} Commons Hub · {t("footer.location")}
        </div>
      </div>
    </footer>
  );
}
