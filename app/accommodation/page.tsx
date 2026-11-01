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

// Content: Directus → Pages → "ACCOMMODATION" → Sections (rooms, common_areas,
// booking). Room prices: Settings → Booking prices.
export function generateMetadata() {
  return pageMetadata("accommodation", {
    title: "Accommodation",
    description:
      "Not a hotel — a communal guesthouse in the Austrian Alps. Rooms, common areas, and a place to slow down and feel at home.",
  });
}

export default async function AccommodationPage() {
  const [page, rooms] = await Promise.all([
    getPageContent("accommodation"),
    getBookingOptions("room"),
  ]);
  const s = page?.sections ?? {};

  return (
    <main className="page-sections">
      {/* Section 1 — Our Rooms (scroll-pinned) — rooms first, then common areas (spec) */}
      {s.rooms && (
        <PinnedCarousel headline={s.rooms.heading} slides={pinnedSlides(s.rooms)} editAttr={sectionEdit(s.rooms)} />
      )}

      {/* Section 2 — Common Areas (scroll-pinned, same model as Home) */}
      {s.common_areas && (
        <PinnedCarousel
          headline={s.common_areas.heading}
          slides={pinnedSlides(s.common_areas)}
          editAttr={sectionEdit(s.common_areas)}
        />
      )}

      {/* Section 3 — Book your stay (form left, sticky price calc right) */}
      <section className="px-6 py-12 max-w-6xl mx-auto" {...sectionEdit(s.booking)}>
        {s.booking?.heading && <h2 className="h2 mb-6">{s.booking.heading}</h2>}
        <BookingForm variant="stay" rooms={rooms} />
      </section>
      <SiteFooter />
    </main>
  );
}
