import { Metadata } from "next";
import { getImageUrl } from "./getImageUrl";

type OgType = "website" | "article" | "profile" | "book";

interface MetadataParams {
  title: string | null;
  description?: string | null;
  image?: string | null; // Image ID or filename
  icon?: string | null;  // Icon ID or filename
  url?: string;
  type?: OgType;
}

/**
 * Generate metadata for pages based on content
 * @param params - Metadata parameters including title, description, image/icon IDs
 * @returns Metadata object for Next.js
 */
export async function generatePageMetadata({
  title,
  description,
  image,
  icon,
  url = "https://www.commons-hub.at",
  type = "website",
}: MetadataParams): Promise<Metadata> {
  // Clean description text (remove HTML tags if present)
  const cleanDescription = description 
    ? description.replace(/<[^>]*>/g, '')
    : "The Commons-Hub is a co-working, co-living and event venue in the Austrian Alps that harbours artists, digital movements and decentralized communities.";
  
  // Get image URL (prioritize main image over icon)
  let imageUrl = "";
  if (image) {
    imageUrl = await getImageUrl(image);
  } else if (icon) {
    imageUrl = await getImageUrl(icon);
  }

  if (imageUrl && imageUrl.includes('/assets/')) {
    imageUrl += '?quality=60';
  }

  // Default title fallback
  const pageTitle = title || "Commons Hub";

  return {
    title: pageTitle,
    description: cleanDescription,
    openGraph: {
      title: pageTitle,
      description: cleanDescription,
      url: url,
      siteName: "Commons Hub",
      images: imageUrl ? [
        {
          url: imageUrl,
          alt: pageTitle,
        },
      ] : undefined,
      locale: "en_US",
      type: type,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: cleanDescription,
      images: imageUrl ? [
        {
          url: imageUrl,
          alt: pageTitle,
        }
      ] : undefined,
    },
    other: {
      'telegram-bot-api-site-preview': 'true',
      'cache-control': 'no-cache, no-store, must-revalidate'
    }
  };
}
