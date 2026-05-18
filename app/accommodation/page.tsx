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
      {/* Section 1 — This is not a Hotel (text verbatim from spec) */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h1 className="h1 mb-6">This is not a Hotel.</h1>
        <p>
          From remote workers and solo wanderers to small teams,<br />
          artists-in-residence, and friends passing through —<br />
          the commons hub offers more than just a bed.<br />
          It&apos;s a space to slow down, plug in (or out), and feel at home.
        </p>
        <p>
          The vibe: Laid-back, but intentional.<br />
          No front desk. Minimal rules. Maximum freedom.<br />
          A place to feel at home, even if you just arrived.
        </p>
      </section>

      {/* Section 2 — Common Areas (scroll-pinned, same model as Home) */}
      <PinnedCarousel headline="Common Areas" slides={toPinned(COMMON_AREAS)} />

      {/* Section 3 — Our Rooms (scroll-pinned) */}
      <PinnedCarousel headline="Our Rooms" slides={toPinned(ROOMS)} />

      {/* Section 4 — Book your stay */}
      <section className="px-6 py-12 max-w-4xl mx-auto">
        <h2 className="h2 mb-6">Book your stay</h2>
        <BookingForm variant="stay" />
      </section>
      <SiteFooter />
    </main>
  );
}
