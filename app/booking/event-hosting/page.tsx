import Image from "next/image";
import WhiteOverlay from "@/components/WhiteOverlay";
import ClientSideRout from "@/components/ClientSideRout";
import ScrollIndicator from "@/components/ScrollIndicator";
import { BookingForm } from "@/components/bookings/BookingForm";

export const metadata = {
  title: "Plan an Event | Commons Hub",
  description:
    "Host your gathering at the Commons Hub — a venue in the Austrian Alps with a 90m² conference hall, a maker hall, and a 45m² seminar room.",
};

export default async function EventBookingPage() {
  return (
    <div className="section">
      <div className="content">
        <div className="grid-block">
          <div className="scroll-block">
            <div className="scroll-block-element">
              <div className="p mb-8">
                <h2 className="heading h2 mb-4">Laid back, but intentional.</h2>
                <p>
                  The Commons Hub harbours artists, dreamers, hackers and tinkerers weaving
                  sustainable perspectives across technology, economy, society and nature.
                  Bring your gathering — we&apos;ll match the room to the work.
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg mb-8 relative overflow-hidden">
                <WhiteOverlay />
                <h2 className="heading h2 mb-4">Event spaces</h2>
                <ul className="space-y-3">
                  <li>
                    <strong>Conference Hall</strong> — 90m², 60 chairs, projector, sound
                    system, livestream-ready.
                  </li>
                  <li>
                    <strong>Maker Hall</strong> — 90m² with laser cutter, 3D printer and
                    fabrication equipment.
                  </li>
                  <li>
                    <strong>Seminar Room</strong> — 45m², 20 chairs, flexible setup.
                  </li>
                </ul>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg mb-8 relative overflow-hidden">
                <WhiteOverlay />
                <h2 className="heading h2 mb-4">Common areas</h2>
                <ul className="space-y-3">
                  <li>
                    <strong>Lounge</strong> — vintage couches, a vinyl record player,
                    board games, and a community library.
                  </li>
                  <li>
                    <strong>Kitchen</strong> — fully equipped for late-night cooking
                    sessions and shared meals.
                  </li>
                  <li>
                    <strong>Garden</strong> — frisbee-sized, with a fire bowl and veggie
                    gardens.
                  </li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="heading h2 mb-4">Send an inquiry</h2>
                <BookingForm variant="event" />
              </div>

              <p className="text-sm text-slate-500">
                Need more than the spaces? See the{" "}
                <a className="underline" href="https://commons-hub.at" target="_blank" rel="noreferrer">
                  Event Organizer Toolbox
                </a>{" "}
                for templates, facilitation tools and service providers.
              </p>
            </div>

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
                <div className="icon-wrapper">
                  <div className="icon-block">
                    <div className="icon-image">
                      <Image
                        src="/logos/VERTICAL_commons_hub_LOGO_black.svg"
                        alt="Commons Hub Logo"
                        width={400}
                        height={400}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="description-block relative overflow-hidden bg-slate-50 items-center">
                <WhiteOverlay />
                <h1 className="h1 mb-0 font-light">PLAN AN EVENT</h1>
              </div>
            </div>
          </div>
          <ScrollIndicator />
        </div>
      </div>
    </div>
  );
}
