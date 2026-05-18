import { SideCarousel } from "@/components/SideCarousel";
import { BookingForm } from "@/components/bookings/BookingForm";
import { COMMON_AREAS, ROOMS } from "@/lib/content/venue";
import ClientSideRout from "@/components/ClientSideRout";

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

      {/* Section 2 — Common Areas */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <h2 className="h2 mb-6">Common Areas</h2>
        <SideCarousel headline="Common Areas" slides={COMMON_AREAS} />
      </section>

      {/* Section 3 — Our Rooms */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <h2 className="h2 mb-6">Our Rooms</h2>
        <SideCarousel headline="Our Rooms" slides={ROOMS} />
      </section>

      {/* Section 4 — Book your stay */}
      <section className="px-6 py-12 max-w-4xl mx-auto">
        <h2 className="h2 mb-6">Book your stay</h2>
        <BookingForm variant="stay" />
      </section>

      <footer className="footer">
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
      </footer>
    </main>
  );
}
