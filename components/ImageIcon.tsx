import Image from "next/image";
import WhiteOverlay from "./WhiteOverlay";
import { getImageUrl } from "@/lib/utils/getImageUrl";

interface ImageIconProps {
  mainImage?: string | null;
  mainIcon?: string | null;
  title?: string | null;
}

export default async function ImageIcon({ mainImage, mainIcon, title }: ImageIconProps) {
  if (!mainImage && !mainIcon) return null;
  return (
    <div className="hero-image w-embed relative overflow-hidden">
      <WhiteOverlay />
      {mainImage ? (
        <Image
          src={await getImageUrl(mainImage, 'website-images')}
          alt={title || 'Page image'}
          width={1000}
          height={1000}
          className="rounded-lg shadow-md"
        />
      ) : mainIcon && (
        <Image
          src={await getImageUrl(mainIcon, 'website-images')}
          alt={title || 'Homepage icon'}
          width={400}
          height={400}
        />
      )}
    </div>
  );
}
