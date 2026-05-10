import { createClient } from '@/lib/supabase/client';

/**
 * Client-side helper function to get the URL for an image stored in Supabase Storage
 * @param imageIdOrName - Either a UUID (id from website_images) or a direct filename
 * @param bucketName - The name of the bucket (defaults to 'website-images')
 * @returns The complete URL to the image
 */
// Image URLs use NEXT_PUBLIC_IMAGE_BASE_URL (HTTP) so the Next.js image
// optimizer (server-side fetch from /_next/image) reaches Traefik's HTTP
// entrypoint. The websecure entrypoint has no router for the storage
// path and serves a self-signed cert, which fails with
// DEPTH_ZERO_SELF_SIGNED_CERT. The browser only sees /_next/image?url=...
// so there is no mixed-content concern.
const baseUrl =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function getImageUrlClient(imageIdOrName: string, bucketName: string = 'website-images'): Promise<string> {
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

      return `${baseUrl}/storage/v1/object/public/${bucketName}/${data.name}`;
    }

    return `${baseUrl}/storage/v1/object/public/${bucketName}/${imageIdOrName}`;
  } catch (error) {
    console.error('Error in getImageUrlClient:', error);
    return '';
  }
}
