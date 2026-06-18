"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
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

// Sets the NEXT_LOCALE cookie and refreshes so server components re-render in the
// chosen language. URLs are unchanged (cookie-based locale; see docs/i18n-plan.md).
export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSelect = (next: string) => {
    if (next === locale) return;
    // 1 year, site-wide
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
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
