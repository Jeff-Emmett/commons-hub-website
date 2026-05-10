'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import WhiteOverlay from './WhiteOverlay';
import { createClient } from '@/lib/supabase/client';

interface IconImageClientProps {
  mainImage?: string | null;
  mainIcon?: string | null;
  title?: string | null;
}

/**
 * Client-side version of IconImage component that fetches image URLs from Supabase
 */
export default function IconImageClient({ mainImage, mainIcon, title }: IconImageClientProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  
  useEffect(() => {
    async function fetchImageUrl() {
      const imageId = mainIcon || mainImage;
      if (!imageId) return;
      
      try {
        const url = await getImageUrlClient(imageId);
        setImageUrl(url);
      } catch (error) {
        console.error('Error fetching image URL:', error);
      }
    }
    
    fetchImageUrl();
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

/**
 * Client-side helper function to get the URL for an image stored in Supabase Storage
 * @param imageIdOrName - Either a UUID (id from website_images) or a direct filename
 * @param bucketName - The name of the bucket (defaults to 'website-images')
 * @returns The complete URL to the image
 */
// HTTP base so the Next.js image optimizer reaches Traefik's HTTP entrypoint
// — websecure has no router for the storage path and serves a self-signed cert.
const STORAGE_BASE_URL =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

async function getImageUrlClient(imageIdOrName: string, bucketName: string = 'website-images'): Promise<string> {
  if (!imageIdOrName) return '';

  try {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidPattern.test(imageIdOrName)) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('website_images')
        .select('name')
        .eq('id', imageIdOrName)
        .single();

      if (error || !data) {
        console.error('Error fetching image filename:', error);
        return '';
      }

      return `${STORAGE_BASE_URL}/storage/v1/object/public/${bucketName}/${data.name}`;
    }

    return `${STORAGE_BASE_URL}/storage/v1/object/public/${bucketName}/${imageIdOrName}`;
  } catch (error) {
    console.error('Error in getImageUrlClient:', error);
    return '';
  }
}
