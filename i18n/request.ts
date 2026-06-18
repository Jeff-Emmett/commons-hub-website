import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export const LOCALE_COOKIE = "NEXT_LOCALE";

// Locale is selected via the NEXT_LOCALE cookie (set by <LanguageSwitcher/>),
// so existing URLs are unchanged — no /de, /hu route prefixes. Locale-prefixed
// routing can be layered on later (see docs/i18n-plan.md, Phase 2 note).
export default getRequestConfig(async () => {
  const store = await cookies();
  const requested = store.get(LOCALE_COOKIE)?.value;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
