import Image from "next/image";
import Link from "next/link";
import { getEventPage } from "@/lib/actions/getEventPage";
import { getPageBySlug } from "@/lib/actions/getPage";
import ImageIcon from "@/components/ImageIcon";
import WhiteOverlay from "@/components/WhiteOverlay";
import ClientSideRout from "@/components/ClientSideRout";
import ScrollIndicator from "@/components/ScrollIndicator";

const DIRECTUS_ASSET_BASE = (
  process.env.NEXT_PUBLIC_DIRECTUS_URL || "https://admin.commons-hub.at"
).replace(/\/$/, "");

export const metadata = {
  title: "Events | Commons Hub",
  description:
    "Upcoming gatherings, hackathons and residencies at the Commons Hub in the Austrian Alps.",
};

interface EventRow {
  id: number;
  slug: string;
  title: string | null;
  summary: string | null;
  main_image: string | null;
  startdatetime: string | null;
  enddatetime: string | null;
}

function fmtMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function fmtDateRange(start: string | null, end: string | null): string {
  if (!start) return "TBA";
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const sameMonth = e && s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  if (!e) return s.toLocaleDateString("en-GB", opts);
  if (sameMonth) {
    return `${s.toLocaleDateString("en-GB", { day: "numeric" })}–${e.toLocaleDateString("en-GB", opts)}`;
  }
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", opts)}`;
}

function groupByMonth(events: EventRow[]): Array<{ key: string; events: EventRow[] }> {
  const buckets = new Map<string, EventRow[]>();
  for (const ev of events) {
    if (!ev.startdatetime) continue;
    const key = fmtMonthYear(ev.startdatetime);
    const list = buckets.get(key) ?? [];
    list.push(ev);
    buckets.set(key, list);
  }
  return Array.from(buckets.entries()).map(([key, evs]) => ({ key, events: evs }));
}

function EventTile({ ev }: { ev: EventRow }) {
  return (
    <Link
      href={`/events/${ev.slug}`}
      className="group block overflow-hidden rounded-xl bg-slate-100 hover:shadow-lg transition-shadow"
    >
      <div className="relative aspect-[4/3] bg-slate-200">
        {ev.main_image && (
          <Image
            src={`${DIRECTUS_ASSET_BASE}/assets/${ev.main_image}`}
            alt={ev.title ?? ""}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {fmtDateRange(ev.startdatetime, ev.enddatetime)}
        </p>
        <h3 className="mt-1 text-lg font-semibold leading-tight">{ev.title}</h3>
        {ev.summary && (
          <p className="mt-2 text-sm text-slate-600 line-clamp-3">{ev.summary}</p>
        )}
      </div>
    </Link>
  );
}

export default async function EventsIndex() {
  const [upcoming, past, page] = await Promise.all([
    getEventPage("upcoming") as Promise<EventRow[]>,
    getEventPage("past") as Promise<EventRow[]>,
    getPageBySlug("events"),
  ]);

  const featured = upcoming[0];
  const restUpcoming = upcoming.slice(1);
  const upcomingByMonth = groupByMonth(restUpcoming);

  return (
    <div className="section">
      <div className="content">
        <div className="grid-block">
          <div className="scroll-block">
            {featured && (
              <section className="scroll-block-element mb-8">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                  Next up · {fmtDateRange(featured.startdatetime, featured.enddatetime)}
                </p>
                <h2 className="h2 mb-4">{featured.title}</h2>
                {featured.main_image && (
                  <Link
                    href={`/events/${featured.slug}`}
                    className="relative block aspect-[16/9] overflow-hidden rounded-xl mb-4 bg-slate-100"
                  >
                    <Image
                      src={`${DIRECTUS_ASSET_BASE}/assets/${featured.main_image}`}
                      alt={featured.title ?? ""}
                      fill
                      sizes="(max-width: 768px) 100vw, 66vw"
                      className="object-cover"
                      priority
                    />
                  </Link>
                )}
                {featured.summary && (
                  <p className="text-slate-700 mb-4">{featured.summary}</p>
                )}
                <Link
                  href={`/events/${featured.slug}`}
                  className="button inline-block"
                >
                  Read more →
                </Link>
              </section>
            )}

            {upcomingByMonth.length > 0 && (
              <section className="scroll-block-element mb-8">
                <h2 className="h2 mb-4">Calendar</h2>
                <div className="space-y-2">
                  {upcomingByMonth.map((group) => (
                    <details
                      key={group.key}
                      className="rounded-lg border border-slate-200 bg-white"
                      open
                    >
                      <summary className="cursor-pointer select-none px-4 py-3 font-medium text-slate-800 hover:bg-slate-50">
                        {group.key} <span className="text-slate-500 text-sm">({group.events.length})</span>
                      </summary>
                      <ul className="px-4 pb-4 space-y-2">
                        {group.events.map((ev) => (
                          <li key={ev.id} className="flex items-baseline justify-between gap-4 py-1 border-t border-slate-100 pt-2">
                            <Link
                              href={`/events/${ev.slug}`}
                              className="font-medium text-slate-900 hover:underline"
                            >
                              {ev.title}
                            </Link>
                            <span className="text-sm text-slate-500 tabular-nums whitespace-nowrap">
                              {fmtDateRange(ev.startdatetime, ev.enddatetime)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section className="scroll-block-element">
                <h2 className="h2 mb-4">Past events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {past.slice(0, 12).map((ev) => (
                    <EventTile key={ev.id} ev={ev} />
                  ))}
                </div>
              </section>
            )}

            <div className="footer">
              <div className="footer-wrapper">
                <div className="footer-bottom">
                  <div className="bottom-details">
                    <p className="bottom-link inline"> Commons Hub</p>
                  </div>
                  <div className="bottom-details">
                    <ClientSideRout route={`/page/impressum`} ariaLabel="Impressum">
                      <p className="bottom-link">Impressum</p>
                    </ClientSideRout>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky-block">
            <div className="hero-block-content">
              <div className="heading-block">
                <ImageIcon
                  mainImage={page?.main_image}
                  mainIcon={page?.main_icon}
                  title={page?.title ?? "Events"}
                />
              </div>
              <div className="description-block relative overflow-hidden bg-slate-50 items-center">
                <WhiteOverlay />
                <h1 className="h1 mb-0 font-light">EVENTS</h1>
              </div>
            </div>
          </div>
          <ScrollIndicator />
        </div>
      </div>
    </div>
  );
}
