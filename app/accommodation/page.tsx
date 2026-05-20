import { PinnedCarousel } from "@/components/journey/PinnedCarousel";
import { BookingForm } from "@/components/bookings/BookingForm";
import { COMMON_AREAS, ROOMS, toPinned } from "@/lib/content/venue";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Accommodation | Commons Hub",
  description:
    "Not a hotel — a communal guesthouse in the Austrian Alps. Rooms, common areas, and a place to slow down and feel at home.",
};

export default function AccommodationPage() {
  return (
    <main className="page-sections">
      {/* Section 1 — Common Areas (scroll-pinned, same model as Home) */}
      <PinnedCarousel headline="Common Areas" slides={toPinned(COMMON_AREAS)} />

      {/* Section 2 — Our Rooms (scroll-pinned) */}
      <PinnedCarousel headline="Our Rooms" slides={toPinned(ROOMS)} />

      {/* Section 3 — Book your stay (form left, sticky price calc right) */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="h2 mb-6">Book your stay</h2>
        <BookingForm variant="stay" />
      </section>
      <SiteFooter />
    </main>
  );
}
