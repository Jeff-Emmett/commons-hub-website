import Link from "next/link";
import { PinnedCarousel } from "@/components/journey/PinnedCarousel";
import { BookingForm } from "@/components/bookings/BookingForm";
import { COMMON_AREAS, EVENT_SPACES, toPinned } from "@/lib/content/venue";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Event Venue | Commons Hub",
  description:
    "Host your event at the commons hub — events as commons, shaped by mutual care and respect among peers.",
};

export default function EventVenuePage() {
  return (
    <main className="page-sections">
      {/* Section 1 — Common Areas (scroll-pinned, same model as Home) */}
      <PinnedCarousel headline="Common Areas" slides={toPinned(COMMON_AREAS)} />

      {/* Section 2 — Event Spaces (scroll-pinned) */}
      <PinnedCarousel headline="Event Spaces" slides={toPinned(EVENT_SPACES)} />

      {/* Section 4 — Book Event Space */}
      <section className="px-6 py-12 max-w-4xl mx-auto">
        <h2 className="h2 mb-6">Book Event Space</h2>

        <div className="bg-slate-50 rounded-lg p-5 mb-8 text-sm leading-relaxed">
          <p className="font-medium mb-2">Event Space Packages</p>
          <ul className="space-y-1 list-disc pl-5">
            <li>Small (€200 / day, 20 persons max.): Seminar Room + Common Areas</li>
            <li>Medium (€500 / day, 30 persons max.): Both Halls, Seminar Room + Common Areas</li>
            <li>Large (€700 / day, 65 persons max.): Spa Area, Both Halls, Seminar Room + Common Areas</li>
            <li>Extra Large (€1.000 / day, 100 persons max.): Spa Area, Both Halls, Seminar Room + Common Areas</li>
            <li>I don&apos;t know yet - let&apos;s have a call and talk it through</li>
          </ul>
        </div>

        <BookingForm variant="event" />

        <div className="mt-10 border-t border-gray-100 pt-8">
          <Link
            href="/event-toolbox"
            className="button inline-block"
          >
            Event Organizer Toolbox
          </Link>
          <p className="mt-3 text-slate-600">
            Need help with organizing? We got ample experience - check our free
            templates.
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
