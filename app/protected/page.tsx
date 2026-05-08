import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@/lib/directus/auth";
import WhiteOverlay from "@/components/WhiteOverlay";
import ClientSideRout from "@/components/ClientSideRout";
import NewsletterSignup from "@/components/NewsletterSignup";
import ScrollIndicator from "@/components/ScrollIndicator";

export default async function ProtectedPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  const greetingName =
    user.first_name?.trim() || user.email.split("@")[0] || "Member";

  return (
    <div className="section">
      <div className="content">
        <div className="grid-block">
          <div className="scroll-block">
            <div className="scroll-block-element">
              <div className="p mb-8">
                Thank you for logging in to Commons Hub. We&apos;re excited to have you as part of our community.
              </div>
              
              <div className="relative overflow-hidden bg-slate-50 p-6 rounded-lg mb-8">
                <WhiteOverlay />
                <h2 className="heading h2 mb-4">Coming Soon</h2>
                <div className="p mb-4">
                  We&apos;re working hard to bring you exciting new features:
                </div>
                <ul className="list-disc pl-6 mb-6">
                  <li className="p mb-2">Booking App - Easily reserve beds and spaces</li>
                  <li className="p mb-2">Event Organiser&apos;s Toolbox - Guidance and support for event organisers</li>
                  <li className="p mb-2">Commons Hub Wiki - Information and resources for members</li>
                  <li className="p mb-2">Community Functions - Connect with other members</li>
                </ul>
                <div className="p">Stay tuned for updates!</div>
              </div>
              
              <div id="newsletter">
                <NewsletterSignup />
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
                <h1 className="h1 mb-0 font-light">Welcome, {greetingName}!</h1>
                <span className="summary">
                  Your Commons Hub Portal is here. New features are on the way.
                </span>
              </div>
            </div>
          </div>
          <ScrollIndicator />
        </div>
      </div>
    </div>
  );
}
