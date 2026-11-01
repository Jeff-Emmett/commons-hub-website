import Link from "next/link";
import { PinnedCarousel } from "@/components/journey/PinnedCarousel";
import { BookingForm } from "@/components/bookings/BookingForm";
import SiteFooter from "@/components/SiteFooter";
import {
  getBookingOptions,
  getPageContent,
  pageMetadata,
  pinnedSlides,
  sectionEdit,
} from "@/lib/cms/content";

// Content: Directus → Pages → "EVENT VENUE" → Sections (event_spaces, booking).
// The Common Areas slideshow is shared with, and edited on, the Accommodation
// page. Package prices: Settings → Booking prices.
export function generateMetadata() {
  return pageMetadata("venue", {
    title: "Event Venue",
    description:
      "Host your event at the commons hub — events as commons, shaped by mutual care and respect among peers.",
  });
}

export default async function EventVenuePage() {
  const [page, shared, packages] = await Promise.all([
    getPageContent("venue"),
    getPageContent("accommodation"),
    getBookingOptions("event_package"),
  ]);
  const s = page?.sections ?? {};
  const commonAreas = shared?.sections.common_areas;
  const booking = s.booking;

  return (
    <main className="page-sections">
      {/* Section 1 — Event Spaces (scroll-pinned) — event spaces first, then common areas (spec) */}
      {s.event_spaces && (
        <PinnedCarousel
          headline={s.event_spaces.heading}
          slides={pinnedSlides(s.event_spaces)}
          editAttr={sectionEdit(s.event_spaces)}
        />
      )}

      {/* Section 2 — Common Areas (scroll-pinned, same model as Home) */}
      {commonAreas && (
        <PinnedCarousel
          headline={commonAreas.heading}
          slides={pinnedSlides(commonAreas)}
          editAttr={sectionEdit(commonAreas)}
        />
      )}

      {/* Section 3 — Book Event Space (form left, sticky price calc right) */}
      <section className="px-6 py-12 max-w-6xl mx-auto" {...sectionEdit(booking)}>
        {booking?.heading && <h2 className="h2 mb-6">{booking.heading}</h2>}

        <BookingForm variant="event" packages={packages} />

        {(booking?.button_label || booking?.text) && (
          <div className="mt-10 border-t border-gray-100 pt-8">
            {booking.button_label && booking.button_link && (
              <Link href={booking.button_link} className="button inline-block">
                {booking.button_label}
              </Link>
            )}
            {booking.text && (
              <p className="mt-3 text-slate-600" dangerouslySetInnerHTML={{ __html: booking.text }} />
            )}
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
