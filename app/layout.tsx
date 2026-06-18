import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import Header2 from "@/components/layout/Header2";
import { getMenu } from "@/lib/actions/getMenu";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import ContentLightbox from "@/components/ContentLightbox"
import ScrollIndicator from "@/components/ScrollIndicator"
import { CarouselVisibilityProvider } from "@/lib/contexts/CarouselVisibilityContext"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"

const urbanist = Urbanist({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://commons-hub.at"),
  title: {
    default: "Event Venue & Co-Living in the Austrian Alps | Commons Hub",
    template: "%s | Commons Hub",
  },
  description:
    "The Commons-Hub is a co-working, co-living and event venue in the Austrian Alps that harbours artists, digital movements and decentralized communities exploring the liberatory potential of emerging technologies.",
  openGraph: {
    title: "Commons Hub",
    description: "The Commons-Hub is an experimental playground for regenerative systems design in the Austrian Alps that harbours artists, digital movements and decentralized communities.",
    url: "https://www.commons-hub.at",
    siteName: "Commons Hub",
    images: [
      {
        url: "https://www.commons-hub.at/logos/VERTICAL_commons_hub_LOGO_black_10cm.png",
        width: 600,
        height: 600,
        alt: "Commons Hub Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Commons Hub",
    description: "The Commons-Hub is a co-working, co-living and event venue in the Austrian Alps.",
    images: ["https://www.commons-hub.at/logos/VERTICAL_commons_hub_LOGO_black_10cm.png"],
  },
  other: {
    'telegram-bot-api-site-preview': 'true',
    'cache-control': 'no-cache, no-store, must-revalidate'
  }
};

// Ensure proper mobile scaling; prevents initial zoom on some devices
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const menus = await getMenu();
  const locale = await getLocale();
  const messages = await getMessages();

  if (!menus) {
    return null;
  }

  return (
    <html lang={locale} prefix="og: http://ogp.me/ns#">
      <body className={`${urbanist.className} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
        <AuthProvider>
          <CarouselVisibilityProvider>
            {/* Header placeholder to maintain layout flow */}
            <div className="h-20"></div>

            {/* Fixed header */}
            <div className="fixed top-0 left-0 w-full z-50">
              <Header2 menus={menus} />
            </div>

            {/* Global left-hand social sidebar — present on every page,
                self-hides while a viewport-occupying carousel is live. */}
            <ScrollIndicator />

            {children}
            <ContentLightbox />
            <Analytics />
            <SpeedInsights />
          </CarouselVisibilityProvider>
        </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
