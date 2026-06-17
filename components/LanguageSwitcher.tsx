"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { routing } from "@/i18n/routing";

// Native-name labels so each language is shown in its own language.
const LABELS: Record<string, string> = {
  en: "English",
  de: "Deutsch",
  hu: "Magyar",
  cs: "Čeština",
  sk: "Slovenčina",
};

// Dropdown that swaps the locale segment of the current path.
// Inert until routes live under app/[locale]/… (see docs/i18n-plan.md, Phase 2).
export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const onSelect = (next: string) => {
    if (next === locale) return;
    // Strip any existing locale prefix, then prepend the new one (except default).
    const stripped = pathname.replace(
      new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`),
      "",
    );
    const path = stripped || "/";
    const target =
      next === routing.defaultLocale ? path : `/${next}${path === "/" ? "" : path}`;
    startTransition(() => router.push(target));
  };

  return (
    <select
      aria-label="Language"
      value={locale}
      disabled={isPending}
      onChange={(e) => onSelect(e.target.value)}
      className="bg-transparent text-sm border border-gray-200 rounded px-2 py-1"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {LABELS[l] ?? l}
        </option>
      ))}
    </select>
  );
}
