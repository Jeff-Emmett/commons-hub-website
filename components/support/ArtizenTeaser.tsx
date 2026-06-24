"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Compact homepage teaser for the Artizen campaign. Links to /support rather
 * than straight to Artizen so the visitor reads the match-funding explainer
 * first (and we keep them on-site one step longer).
 */
export default function ArtizenTeaser() {
  const t = useTranslations("support");
  return (
    <section className="bg-slate-900 px-8 md:px-16 py-16 text-white">
      <div className="max-w-5xl mx-auto flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="md:max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400 mb-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 align-middle" />
            {t("teaserKicker")}
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold mb-2">
            {t("teaserHeading")}
          </h2>
          <p className="text-slate-300 leading-relaxed">{t("teaserBody")}</p>
        </div>
        <Link
          href="/support"
          className="flex-none rounded-full bg-white px-7 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-200"
        >
          {t("teaserCta")}
        </Link>
      </div>
    </section>
  );
}
