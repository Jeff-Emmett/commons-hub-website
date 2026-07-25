"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { routing } from "@/i18n/routing";
import { LOCALE_COOKIE, LOCALE_SOURCE_COOKIE } from "@/lib/i18n/geo";
import { cn } from "@/lib/utils";

// Native name first (a visitor recognises their own language), English name as
// the quiet second line so an English speaker can still navigate the list.
const LANGUAGES: Record<string, { native: string; english: string; code: string }> = {
  en: { native: "English", english: "English", code: "EN" },
  de: { native: "Deutsch", english: "German", code: "DE" },
  hu: { native: "Magyar", english: "Hungarian", code: "HU" },
  cs: { native: "Čeština", english: "Czech", code: "CS" },
  sk: { native: "Slovenčina", english: "Slovak", code: "SK" },
};

const ONE_YEAR = 60 * 60 * 24 * 365;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

type Props = {
  /** "header" = compact bordered control; "menu" = full-width list for the mobile drawer. */
  variant?: "header" | "menu";
  className?: string;
};

/**
 * Language picker. Writes the NEXT_LOCALE cookie and refreshes so server
 * components re-render in the chosen language — URLs are unchanged
 * (cookie-based locale; see docs/i18n-plan.md).
 *
 * A first-time visitor's language is guessed from their IP by the middleware
 * (lib/i18n/geo.ts); picking here marks the choice as explicit so the guess
 * never overrides it again.
 */
export function LanguageSwitcher({ variant = "header", className }: Props) {
  const locale = useLocale();
  const t = useTranslations("language");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [autoDetected, setAutoDetected] = useState(false);

  useEffect(() => {
    // Value is "auto" or "auto.<reason>" (e.g. "auto.geo-AT").
    setAutoDetected(!!readCookie(LOCALE_SOURCE_COOKIE)?.startsWith("auto"));
  }, [locale]);

  const select = (next: string) => {
    if (next === locale) return;
    const attrs = `path=/; max-age=${ONE_YEAR}; samesite=lax`;
    document.cookie = `${LOCALE_COOKIE}=${next}; ${attrs}`;
    document.cookie = `${LOCALE_SOURCE_COOKIE}=user; ${attrs}`;
    setAutoDetected(false);
    startTransition(() => router.refresh());
  };

  const active = LANGUAGES[locale] ?? LANGUAGES.en;

  // Mobile drawer: no popover, just a legible list of the five languages.
  if (variant === "menu") {
    return (
      <div className={className}>
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
          <Globe className="h-4 w-4" aria-hidden />
          {t("label")}
        </div>
        <div className="flex flex-wrap gap-2">
          {routing.locales.map((code) => {
            const lang = LANGUAGES[code];
            const isActive = code === locale;
            return (
              <button
                key={code}
                type="button"
                lang={code}
                aria-current={isActive ? "true" : undefined}
                disabled={isPending}
                onClick={() => select(code)}
                className={cn(
                  "border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60",
                  isActive
                    ? "border-black bg-black text-white"
                    : "border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50",
                )}
              >
                {lang.native}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={t("label")}
        disabled={isPending}
        className={cn(
          "group inline-flex h-9 items-center gap-2 border border-gray-200 px-3",
          "text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-900",
          "outline-none transition-colors duration-200",
          "hover:border-black hover:bg-black hover:text-white",
          "focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
          "data-[state=open]:border-black data-[state=open]:bg-black data-[state=open]:text-white",
          "disabled:opacity-60",
          className,
        )}
      >
        <Globe className="h-[15px] w-[15px]" aria-hidden />
        <span>{active.code}</span>
        <ChevronDown
          className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-50 min-w-[224px] border border-gray-200 bg-white p-1",
            "shadow-[0_18px_50px_-20px_rgba(0,0,0,0.45)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-1",
          )}
        >
          <div className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            {t("label")}
          </div>

          {routing.locales.map((code) => {
            const lang = LANGUAGES[code];
            const isActive = code === locale;
            return (
              <DropdownMenu.Item
                key={code}
                lang={code}
                onSelect={() => select(code)}
                className={cn(
                  "flex cursor-pointer select-none items-center justify-between gap-4 px-3 py-2.5 outline-none",
                  "transition-colors duration-150 data-[highlighted]:bg-gray-100",
                  isActive && "bg-gray-50",
                )}
              >
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-gray-900">{lang.native}</span>
                  {lang.english !== lang.native && (
                    <span className="text-[11px] text-gray-400">{lang.english}</span>
                  )}
                </span>
                {isActive ? (
                  <Check className="h-4 w-4 shrink-0 text-gray-900" aria-hidden />
                ) : (
                  <span className="text-[10px] font-semibold tracking-[0.14em] text-gray-300">
                    {lang.code}
                  </span>
                )}
              </DropdownMenu.Item>
            );
          })}

          {autoDetected && (
            <div className="mt-1 border-t border-gray-100 px-3 py-2 text-[11px] leading-snug text-gray-400">
              {t("autoDetected")}
            </div>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
