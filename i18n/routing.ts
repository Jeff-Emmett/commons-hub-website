import { defineRouting } from "next-intl/routing";

// Locales served by the site. `en` is the default and is NOT prefixed in the URL
// (localePrefix: "as-needed") so existing English URLs keep working unchanged;
// other locales are served under /de, /hu, /cs, /sk.
//
// To add a regional language later (e.g. Slovenian): add its code here and drop
// a messages/<code>.json catalog. Nothing else needs to change.
export const routing = defineRouting({
  locales: ["en", "de", "hu", "cs", "sk"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
