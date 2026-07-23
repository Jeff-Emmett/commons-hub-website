import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { LOCALE_COOKIE, LOCALE_HEADER } from "@/lib/i18n/geo";

export { LOCALE_COOKIE };

// Locale is selected via the NEXT_LOCALE cookie (set by <LanguageSwitcher/> when
// the visitor picks a language, or by the middleware's geo-IP detection on a
// first visit), so existing URLs are unchanged — no /de, /hu route prefixes.
// The x-commons-locale header is the middleware's in-flight signal: it carries
// the detected locale on the very first request, before the cookie exists.
export default getRequestConfig(async () => {
  const [store, headerList] = await Promise.all([cookies(), headers()]);
  const requested =
    store.get(LOCALE_COOKIE)?.value ?? headerList.get(LOCALE_HEADER) ?? undefined;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
