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
import { VisualEditing } from "@/components/VisualEditing"
import { CarouselVisibilityProvider } from "@/lib/contexts/CarouselVisibilityContext"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import { SiteChromeProvider, type SiteChrome } from "@/components/SiteChrome"
import { assetUrl, getPageContent, getSiteSettings, sectionEdit } from "@/lib/cms/content"

const urbanist = Urbanist({ subsets: ["latin"] });

const DEFAULT_OG_IMAGE = "https://www.commons-hub.at/logos/VERTICAL_commons_hub_LOGO_black_10cm.png";

// Site-wide defaults: Directus → Settings → Site settings (search-engine text,
// link-preview text and image). Pages override title/description.
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const ogImage = assetUrl(s.og_image) ?? DEFAULT_OG_IMAGE;
  return {
    metadataBase: new URL("https://commons-hub.at"),
    title: {
      default: s.seo_title_default || "Commons Hub",
      template: `%s${s.seo_title_suffix}`,
    },
    description: s.seo_description,
    openGraph: {
      title: s.og_title,
      description: s.og_description,
      url: "https://www.commons-hub.at",
      siteName: s.site_name,
      images: [
        {
          url: ogImage,
          width: 600,
          height: 600,
          alt: `${s.site_name} Logo`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: s.og_title,
      description: s.twitter_description,
      images: [ogImage],
    },
    other: {
      'telegram-bot-api-site-preview': 'true',
      'cache-control': 'no-cache, no-store, must-revalidate'
    }
  };
}

/** Header/footer/side-bar content for the client components (see SiteChrome). */
async function loadChrome(): Promise<SiteChrome> {
  const [s, footerPage] = await Promise.all([getSiteSettings(), getPageContent("site-footer")]);
  const f = footerPage?.sections ?? {};
  return {
    site_name: s.site_name,
    contact_email: s.contact_email,
    address: s.address,
    telegram_url: s.telegram_url,
    x_url: s.x_url,
    instagram_url: s.instagram_url,
    youtube_url: s.youtube_url,
    footer: {
      title: f.brand?.heading ?? s.site_name,
      tagline: f.brand?.text ?? "",
      location: f.bottom?.text ?? "",
      brandEdit: sectionEdit(f.brand),
      bottomEdit: sectionEdit(f.bottom),
      columns: ["col_visit", "col_discover", "col_community"]
        .map((k) => f[k])
        .filter((c) => c !== undefined)
        .map((c) => ({
          heading: c.heading,
          editAttr: sectionEdit(c),
          links: c.items
            .filter((i) => i.title && i.link)
            .map((i) => ({ id: i.id, label: i.title, href: i.link as string })),
        })),
    },
  };
}

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
  const [menus, locale, messages, chrome] = await Promise.all([
    getMenu(),
    getLocale(),
    getMessages(),
    loadChrome(),
  ]);

  if (!menus) {
    return null;
  }

  return (
    <html lang={locale} prefix="og: http://ogp.me/ns#">
      <body className={`${urbanist.className} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
        <SiteChromeProvider value={chrome}>
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
        </SiteChromeProvider>
        </NextIntlClientProvider>
        <VisualEditing />
      </body>
    </html>
  );
}
