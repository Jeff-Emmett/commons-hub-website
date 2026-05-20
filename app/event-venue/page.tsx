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

      {/* Section 3 — Book Event Space (form left, sticky price calc right) */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="h2 mb-6">Book Event Space</h2>

        <BookingForm variant="event" />

        <div className="mt-10 border-t border-gray-100 pt-8">
          <Link
            href="/event-toolbox"
            className="button inline-block"
          >
            Event Organizer Toolbox
          </Link>
          <p className="mt-3 text-slate-600">
            Need help with organizing? We got ample experience — check our free
            templates.
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
