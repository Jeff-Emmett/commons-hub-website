import { routing } from "@/i18n/routing";

export const LOCALE_COOKIE = "NEXT_LOCALE";
// "auto" when the middleware guessed the language, "user" once the visitor has
// picked one. Only used to label the choice in the UI — never to override it.
export const LOCALE_SOURCE_COOKIE = "NEXT_LOCALE_SOURCE";
// Set by the middleware so the very first request already renders in the
// detected language (the cookie alone would only take effect on the next hit).
export const LOCALE_HEADER = "x-commons-locale";

type Locale = (typeof routing.locales)[number];

const isLocale = (v: string | undefined | null): v is Locale =>
  !!v && (routing.locales as readonly string[]).includes(v);

// Country → language. Only the languages we actually serve; everything else
// falls through to English. Regional neighbours are mapped to the language a
// visitor is most likely to read, not to their official state language.
const COUNTRY_LOCALE: Record<string, Locale> = {
  AT: "de", DE: "de", CH: "de", LI: "de", LU: "de",
  HU: "hu",
  CZ: "cs",
  SK: "sk",
};

// Geo headers, in order of trust. Cloudflare fronts commons-hub.at, so
// `cf-ipcountry` is the one that actually fires in production; the rest are
// fallbacks for other edges / local testing.
const GEO_HEADERS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "x-geo-country",
  "x-country-code",
];

export function countryFromHeaders(headers: Headers): string | null {
  for (const name of GEO_HEADERS) {
    const value = headers.get(name);
    if (value && value.length === 2 && value !== "XX" && value !== "T1") {
      return value.toUpperCase();
    }
  }
  return null;
}

// Parse `Accept-Language: de-AT,de;q=0.9,en;q=0.8` into the best locale we serve.
export function localeFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.split("=")[1]) : 1 };
    })
    .filter((r) => r.tag && !Number.isNaN(r.q))
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}

/**
 * Language for a visitor who has not chosen one yet.
 * Priority: geo-IP country → Accept-Language → English.
 * An explicit choice (the NEXT_LOCALE cookie) always wins and is handled by
 * the caller — this function is only consulted when that cookie is absent.
 */
export function detectLocale(headers: Headers): Locale {
  const country = countryFromHeaders(headers);
  if (country && COUNTRY_LOCALE[country]) return COUNTRY_LOCALE[country];
  return localeFromAcceptLanguage(headers.get("accept-language")) ?? routing.defaultLocale;
}

export { isLocale };
