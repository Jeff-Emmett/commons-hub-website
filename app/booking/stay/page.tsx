import Image from "next/image";
import WhiteOverlay from "@/components/WhiteOverlay";
import ClientSideRout from "@/components/ClientSideRout";
import ScrollIndicator from "@/components/ScrollIndicator";

export default async function BookingPage() {

  return (
    <div className="section">
      <div className="content">
        <div className="grid-block">
          <div className="scroll-block">
            <div className="scroll-block-element">
              <div className="p mb-8">
                <h2 className="heading h2 mb-4">We are excited to welcome you!</h2>
                <p className="mb-6"></p>
              </div>

              <div className="relative overflow-hidden bg-slate-50 p-6 rounded-lg mb-8">
                <WhiteOverlay />
                <h2 className="heading h2 mb-4">Prices:</h2>
                <ul className="list-disc pl-6 mb-6">
                  <li className="p mb-2">Dormitory (4-6 persons per room): 37.90€ per person per night</li>
                  <li className="p mb-2">Twin Room: 47.90€ per person per night</li>
                  <li className="p mb-2">Double Room: 57.90€ per person per night</li>
                  <li className="p mb-2">Single Room: 87.90€ per person per night</li>
                </ul>
              </div>

              <div className="relative overflow-hidden bg-slate-50 p-6 rounded-lg mb-8">
                <WhiteOverlay />
                <h2 className="heading h2 mb-4">How to Book:</h2>
                <p className="p mb-4">
                  We are working on a booking app, but for now you can book via email:
                  <br />
                  Send us an email at <a href="mailto:office@commons-hub.at" className="text-blue-600 hover:underline">office@commons-hub.at</a> with the subject &quot;Booking: Accommodation&quot; and following details:
                </p>
                <ul className="list-disc pl-6 mb-6">
                  <li className="p mb-2">Number of persons</li>
                  <li className="p mb-2">Room type (single, double, twin, multi-bed)</li>
                  <li className="p mb-2">Arrival date</li>
                  <li className="p mb-2">Departure date</li>
                </ul>
                <p className="p">Our team will respond shortly with the next steps.</p>
              </div>
              

            </div>

            <div className="footer">
              <div className="footer-wrapper">
                <div className="footer-bottom">
                  <div className="bottom-details">
                    <p className="bottom-link inline"> Commons Hub</p>
                  </div>
                  <div className="bottom-details">
                    <ClientSideRout
                      route={`/page/impressum`}
                      ariaLabel="Impressum"
                    >
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
