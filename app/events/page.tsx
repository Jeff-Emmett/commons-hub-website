import Link from "next/link";
import { getEventPage } from "@/lib/actions/getEventPage";
import { EventRow, type EventCard } from "@/components/events/EventRow";
import SiteFooter from "@/components/SiteFooter";
import { SectionNav } from "@/components/SectionNav";
import { getTranslations } from "next-intl/server";
import { assetUrl, getPageContent, getSiteSettings, pageMetadata, sectionEdit } from "@/lib/cms/content";

// Content: Directus → Pages → "EVENTS" → Sections (intro, upcoming, calendar,
// past); the events are Blog & Events → Events; the picture for an event
// without one is Settings → Site settings → Event fallback image.
export function generateMetadata() {
  return pageMetadata("events", {
    title: "Events",
    description:
      "Upcoming gatherings, hackathons and residencies at the Commons Hub in the Austrian Alps.",
  });
}

interface EventRowData {
  id: number;
  slug: string;
  title: string | null;
  summary: string | null;
  main_image: string | null;
  startdatetime: string | null;
  enddatetime: string | null;
}

function fmtDateRange(start: string | null, end: string | null, tba: string): string {
  if (!start) return tba;
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  if (!e) return s.toLocaleDateString("en-GB", opts);
  const sameMonth =
    s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    return `${s.toLocaleDateString("en-GB", { day: "numeric" })}–${e.toLocaleDateString("en-GB", opts)}`;
  }
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", opts)}`;
}

function toCards(
  rows: EventRowData[],
  fallbackImage: string | null,
  t: (key: "untitled" | "datesTba") => string,
): EventCard[] {
  return rows.map((ev) => ({
    slug: ev.slug,
    title: ev.title ?? t("untitled"),
    dateLabel: fmtDateRange(ev.startdatetime, ev.enddatetime, t("datesTba")),
    // fallbackImage keeps a tile from ever being blank.
    imageUrl: assetUrl(ev.main_image ?? fallbackImage) ?? "",
  }));
}

export default async function EventsIndex() {
  const [upcoming, past, page, site, t] = await Promise.all([
    getEventPage("upcoming") as Promise<EventRowData[]>,
    getEventPage("past") as Promise<EventRowData[]>,
    getPageContent("events"),
    getSiteSettings(),
    getTranslations("events"),
  ]);
  const { intro, upcoming: upS, calendar, past: pastS } = page?.sections ?? {};
  const cards = (rows: EventRowData[]) => toCards(rows, site.event_fallback_image, (k) => t(k));
  const nav = [
    ["upcoming", upS],
    ["calendar", calendar],
    ["past", pastS],
  ] as const;

  const allPlanned = [...upcoming].sort((a, b) =>
    (a.startdatetime ?? "").localeCompare(b.startdatetime ?? ""),
  );

  return (
    <>
      <div className="max-w-6xl mx-auto px-6 py-12 flex gap-12">
        <SectionNav
          sections={nav
            .filter(([, sec]) => sec)
            .map(([id, sec]) => ({ id, label: sec!.nav_label || sec!.heading }))}
        />
        <div className="flex-1 min-w-0">
          {intro && <h1 className="h1 mb-10" {...sectionEdit(intro)}>{intro.heading}</h1>}

          {upS && (
          <section id="upcoming" className="mb-16 scroll-mt-28" {...sectionEdit(upS)}>
            <h2 className="h2 mb-6 text-center">{upS.heading}</h2>
            <EventRow events={cards(upcoming)} />
          </section>
          )}

          {calendar && (
          <section id="calendar" className="mb-16 scroll-mt-28" {...sectionEdit(calendar)}>
            <h2 className="h2 mb-4">{calendar.heading}</h2>
        <details className="rounded-lg border border-slate-200 bg-white" open>
          <summary className="cursor-pointer select-none px-4 py-3 font-medium text-slate-800 hover:bg-slate-50">
            {t("allPlanned", { count: allPlanned.length })}
          </summary>
          <ul className="px-4 pb-4">
            {allPlanned.map((ev) => (
              <li
                key={ev.id}
                className="flex items-baseline justify-between gap-4 py-2 border-t border-slate-100"
              >
                <Link
                  href={`/events/${ev.slug}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {ev.title}
                </Link>
                <span className="text-sm text-slate-500 tabular-nums whitespace-nowrap">
                  {fmtDateRange(ev.startdatetime, ev.enddatetime, t("datesTba"))}
                </span>
              </li>
            ))}
            {allPlanned.length === 0 && (
              <li className="py-2 text-slate-500" dangerouslySetInnerHTML={{ __html: calendar.text }} />
            )}
          </ul>
        </details>
      </section>
          )}

          {pastS && (
          <section id="past" className="mb-16 scroll-mt-28" {...sectionEdit(pastS)}>
            <h2 className="h2 mb-6 text-center">{pastS.heading}</h2>
            <EventRow events={cards(past)} />
          </section>
          )}
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
