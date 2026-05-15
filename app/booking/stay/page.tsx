import WhiteOverlay from "@/components/WhiteOverlay";
import ClientSideRout from "@/components/ClientSideRout";
import ScrollIndicator from "@/components/ScrollIndicator";
import ImageIcon from "@/components/ImageIcon";
import { getPageBySlug } from "@/lib/actions/getPage";
import { BookingForm } from "@/components/bookings/BookingForm";

export const metadata = {
  title: "Book your Stay | Commons Hub",
  description:
    "Reserve a single, twin, double or shared room at the Commons Hub — a guesthouse in the Austrian Alps. No front desk. Minimal rules. Maximum freedom.",
};

export default async function StayBookingPage() {
  const page = await getPageBySlug("accommodation");
  return (
    <div className="section">
      <div className="content">
        <div className="grid-block">
          <div className="scroll-block">
            <div className="scroll-block-element">
              <div className="p mb-8">
                <h2 className="heading h2 mb-4">No front desk. Minimal rules. Maximum freedom.</h2>
                <p className="mb-2">
                  The Commons Hub is not a traditional hotel. It&apos;s a communal guesthouse where
                  guests share the kitchen, lounge, and garden. You&apos;ll feel more at home than
                  at a chain — and you&apos;ll meet whoever else is staying.
                </p>
                <p>
                  One hour south of Vienna, on the edge of the Austrian Alps. Trail-side,
                  vinyl, vegetable garden, fire bowl.
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg mb-8 relative overflow-hidden">
                <WhiteOverlay />
                <h2 className="heading h2 mb-4">Rooms &amp; rates</h2>
                <p className="mb-4 text-sm text-slate-600">
                  Per person, per night, excluding 10% VAT. City tax applies separately.
                </p>
                <ul className="space-y-2">
                  <li className="flex justify-between border-b border-slate-200 py-2">
                    <span>Single Room</span>
                    <span className="tabular-nums">€85.00 + €4.70 tax</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-200 py-2">
                    <span>Double Room (twin beds)</span>
                    <span className="tabular-nums">€91.00 + €9.40 tax</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-200 py-2">
                    <span>Double Room (kingsize bed)</span>
                    <span className="tabular-nums">€91.00 + €9.40 tax</span>
                  </li>
                  <li className="flex justify-between py-2">
                    <span>Shared room (4–6 beds)</span>
                    <span className="tabular-nums">€35.20 + €4.70 tax</span>
                  </li>
                </ul>
              </div>

              <div className="mb-8">
                <h2 className="heading h2 mb-4">Send an inquiry</h2>
                <BookingForm variant="stay" />
              </div>

              <p className="text-sm text-slate-500">
                Prefer email? Write to{" "}
                <a className="underline" href="mailto:office@commons-hub.at">
                  office@commons-hub.at
                </a>{" "}
                with subject &quot;Booking: Accommodation&quot;.
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
                <ImageIcon
                  mainImage={page?.main_image}
                  mainIcon={page?.main_icon}
                  title={page?.title ?? "Book your Stay"}
                />
              </div>
              <div className="description-block relative overflow-hidden bg-slate-50 items-center">
                <WhiteOverlay />
                <h1 className="h1 mb-0 font-light">BOOK YOUR STAY</h1>
              </div>
            </div>
          </div>
          <ScrollIndicator />
        </div>
      </div>
    </div>
  );
}
