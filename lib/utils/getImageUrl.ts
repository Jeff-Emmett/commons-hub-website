import { createClient } from '@/lib/supabase/server';

/**
 * Helper function to get the URL for an image stored in Supabase Storage
 * @param imageIdOrName - Either a UUID (id from website_images) or a direct filename
 * @param bucketName - The name of the bucket (defaults to 'website-images')
 * @returns The complete URL to the image
 */
// SUPABASE_INTERNAL_URL routes to Traefik's HTTP entrypoint, which has a
// /storage/v1/object/public/website-images router. The public HTTPS host
// has no websecure router and serves a self-signed cert, so server-side
// fetches (Next image optimizer) fail with DEPTH_ZERO_SELF_SIGNED_CERT.
const baseUrl =
  process.env.SUPABASE_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function getImageUrl(imageIdOrName: string, bucketName: string = 'website-images'): Promise<string> {
  if (!imageIdOrName) return '';

  try {
    // Check if the input looks like a UUID (simple check for length and format)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // If it's a UUID, fetch the actual filename from website_images view
    if (uuidPattern.test(imageIdOrName)) {
      const supabase = await createClient();
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
    console.error('Error in getImageUrl:', error);
    return '';
  }
}
