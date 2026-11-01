"use client";

import Link from "next/link";
import { useSite } from "@/components/SiteChrome";

// Content: Directus → Pages → "Footer (every page)" (brand text, the three link
// columns, the bottom line) and Settings → Site settings (email).
export default function SiteFooter() {
  const { contact_email, footer } = useSite();
  return (
    <footer className="bg-white text-slate-600 border-t border-gray-200 mt-16">
      <div className="max-w-6xl mx-auto px-8 py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div {...footer.brandEdit}>
          <p className="text-slate-900 text-lg font-semibold">{footer.title}</p>
          <p className="mt-3 text-sm leading-relaxed">{footer.tagline}</p>
          {contact_email && (
            <a
              href={`mailto:${contact_email}`}
              className="mt-3 inline-block text-sm text-slate-900 font-medium hover:underline"
            >
              {contact_email}
            </a>
          )}
        </div>
        {footer.columns.map((col, i) => (
          <div key={i} {...col.editAttr}>
            <p className="text-slate-900 text-sm font-semibold uppercase tracking-wide mb-3">
              {col.heading}
            </p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.id}>
                  <Link
                    href={l.href}
                    className="text-sm hover:text-slate-900 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-5 text-xs text-slate-500" {...footer.bottomEdit}>
          © {new Date().getFullYear()} {footer.title} · {footer.location}
        </div>
      </div>
    </footer>
  );
}
