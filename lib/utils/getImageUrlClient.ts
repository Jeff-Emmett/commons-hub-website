import { createClient } from '@/lib/supabase/client';

/**
 * Client-side helper function to get the URL for an image stored in Supabase Storage
 * @param imageIdOrName - Either a UUID (id from website_images) or a direct filename
 * @param bucketName - The name of the bucket (defaults to 'website-images')
 * @returns The complete URL to the image
 */
export async function getImageUrlClient(imageIdOrName: string, bucketName: string = 'website-images'): Promise<string> {
  if (!imageIdOrName) return '';
  
  // Use hardcoded project ID for simplicity, or get it from environment
  
  try {
    // Check if the input looks like a UUID (simple check for length and format)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // If it's a UUID, fetch the actual filename from website_images view
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
      
      // Use the fetched filename instead of the UUID
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${data.name}`;
    }
    
    // If it's not a UUID, assume it's already a filename
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${imageIdOrName}`;
  } catch (error) {
    console.error('Error in getImageUrlClient:', error);
    return '';
  }
}
