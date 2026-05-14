import Image from "next/image";
import WhiteOverlay from "./WhiteOverlay";
import { getImageUrl } from "@/lib/utils/getImageUrl";

interface IconImageProps {
  mainImage?: string | null;
  mainIcon?: string | null;
  title?: string | null;
}

export default async function IconImage({ mainImage, mainIcon, title }: IconImageProps) {
  if (!mainImage && !mainIcon) return null;
  return (
    <div className="hero-image w-embed relative overflow-hidden">
      <WhiteOverlay />
      {mainIcon ? (
        <Image
          src={await getImageUrl(mainIcon)}
          alt={title || 'Icon'}
          width={400}
          height={400}
        />
      ) : mainImage && (
        <Image
          src={await getImageUrl(mainImage)}
          alt={title || 'Image'}
          width={1000}
          height={1000}
          className="rounded-lg shadow-md"
        />
      )}
    </div>
  );
}
