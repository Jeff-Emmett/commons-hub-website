import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { LOCALE_COOKIE, LOCALE_HEADER } from "@/lib/i18n/geo";
import { getUiStrings } from "@/lib/cms/content";

export { LOCALE_COOKIE };

type Messages = Record<string, unknown>;

const isNode = (v: unknown): v is Messages => typeof v === "object" && v !== null && !Array.isArray(v);

/** Deep-merge `over` onto `base` (both nested message catalogs). */
function merge(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = out[k];
    out[k] = isNode(v) && isNode(b) ? merge(b, v) : v;
  }
  return out;
}

/** {"booking.errors.name": "…"} -> {booking: {errors: {name: "…"}}} */
function unflatten(flat: Record<string, string>): Messages {
  const out: Messages = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let node = out;
    for (const p of parts.slice(0, -1)) {
      if (!isNode(node[p])) node[p] = {};
      node = node[p] as Messages;
    }
    node[parts[parts.length - 1]] = value;
  }
  return out;
}

// Locale is selected via the NEXT_LOCALE cookie (set by <LanguageSwitcher/> when
// the visitor picks a language, or by the middleware's geo-IP detection on a
// first visit), so existing URLs are unchanged — no /de, /hu route prefixes.
// The x-commons-locale header is the middleware's in-flight signal: it carries
// the detected locale on the very first request, before the cookie exists.
//
// Messages, lowest to highest priority: messages/en.json (every key, so a
// string never shows as its key), messages/<locale>.json, then the Directus
// ui_strings for the locale — which is where editors change them.
export default getRequestConfig(async () => {
  const [store, headerList] = await Promise.all([cookies(), headers()]);
  const requested =
    store.get(LOCALE_COOKIE)?.value ?? headerList.get(LOCALE_HEADER) ?? undefined;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [en, local, cms] = await Promise.all([
    import(`../messages/en.json`).then((m) => m.default as Messages),
    import(`../messages/${locale}.json`).then((m) => m.default as Messages),
    getUiStrings(locale).catch(() => ({})),
  ]);

  return {
    locale,
    messages: merge(merge(en, local), unflatten(cms)),
  };
});
