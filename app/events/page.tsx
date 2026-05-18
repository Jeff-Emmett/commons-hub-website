import Link from "next/link";
import { getEventPage } from "@/lib/actions/getEventPage";
import { EventRow, type EventCard } from "@/components/events/EventRow";
import SiteFooter from "@/components/SiteFooter";
import { SectionNav } from "@/components/SectionNav";

const DIRECTUS_ASSET_BASE = (
  process.env.NEXT_PUBLIC_DIRECTUS_URL || "https://admin.commons-hub.at"
).replace(/\/$/, "");

export const metadata = {
  title: "Events | Commons Hub",
  description:
    "Upcoming gatherings, hackathons and residencies at the Commons Hub in the Austrian Alps.",
};

interface EventRowData {
  id: number;
  slug: string;
  title: string | null;
  summary: string | null;
  main_image: string | null;
  startdatetime: string | null;
  enddatetime: string | null;
}

function fmtDateRange(start: string | null, end: string | null): string {
  if (!start) return "Dates TBA";
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

function toCards(rows: EventRowData[]): EventCard[] {
  return rows.map((ev) => ({
    slug: ev.slug,
    title: ev.title ?? "Untitled",
    dateLabel: fmtDateRange(ev.startdatetime, ev.enddatetime),
    imageUrl: ev.main_image
      ? `${DIRECTUS_ASSET_BASE}/assets/${ev.main_image}`
      : null,
  }));
}

export default async function EventsIndex() {
  const [upcoming, past] = await Promise.all([
    getEventPage("upcoming") as Promise<EventRowData[]>,
    getEventPage("past") as Promise<EventRowData[]>,
  ]);

  const allPlanned = [...upcoming].sort((a, b) =>
    (a.startdatetime ?? "").localeCompare(b.startdatetime ?? ""),
  );

  return (
    <>
      <div className="max-w-6xl mx-auto px-6 py-12 flex gap-12">
        <SectionNav
          sections={[
            { id: "upcoming", label: "Upcoming Events" },
            { id: "calendar", label: "Event Calendar" },
            { id: "past", label: "Past Events" },
          ]}
        />
        <div className="flex-1 min-w-0">
          <h1 className="h1 mb-10">Events</h1>

          <section id="upcoming" className="mb-16 scroll-mt-28">
            <h2 className="h2 mb-6 text-center">Upcoming Events</h2>
            <EventRow events={toCards(upcoming)} />
          </section>

          <section id="calendar" className="mb-16 scroll-mt-28">
            <h2 className="h2 mb-4">Event Calendar</h2>
        <details className="rounded-lg border border-slate-200 bg-white" open>
          <summary className="cursor-pointer select-none px-4 py-3 font-medium text-slate-800 hover:bg-slate-50">
            All planned events ({allPlanned.length})
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
                  {fmtDateRange(ev.startdatetime, ev.enddatetime)}
                </span>
              </li>
            ))}
            {allPlanned.length === 0 && (
              <li className="py-2 text-slate-500">No planned events yet.</li>
            )}
          </ul>
        </details>
      </section>

          <section id="past" className="mb-16 scroll-mt-28">
            <h2 className="h2 mb-6 text-center">Past Events</h2>
            <EventRow events={toCards(past)} />
          </section>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
