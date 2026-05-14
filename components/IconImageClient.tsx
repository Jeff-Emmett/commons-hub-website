'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import WhiteOverlay from './WhiteOverlay';
import { getImageUrlClient } from '@/lib/utils/getImageUrlClient';

interface IconImageClientProps {
  mainImage?: string | null;
  mainIcon?: string | null;
  title?: string | null;
}

export default function IconImageClient({ mainImage, mainIcon, title }: IconImageClientProps) {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const imageId = mainIcon || mainImage;
    if (!imageId) return;
    getImageUrlClient(imageId)
      .then(setImageUrl)
      .catch((error) => console.error('Error fetching image URL:', error));
  }, [mainIcon, mainImage]);

  if (!imageUrl) {
    return <div className="hero-image w-embed relative overflow-hidden"><WhiteOverlay /></div>;
  }

  return (
    <div className="hero-image w-embed relative overflow-hidden">
      <WhiteOverlay />
      {mainIcon ? (
        <div className="relative w-full aspect-square overflow-hidden">
          <Image
            src={imageUrl}
            alt={title || 'Icon'}
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="transition-transform duration-200 group-hover:scale-110"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
      ) : mainImage && (
        <div className="relative w-full aspect-square overflow-hidden rounded-lg shadow-md">
          <Image
            src={imageUrl}
            alt={title || 'Image'}
            fill
            sizes="(max-width: 640px) 100vw, 1000px"
            className="transition-transform duration-200 group-hover:scale-110"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
      )}
    </div>
  );
}
