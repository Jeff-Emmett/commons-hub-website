// lib/actions/getPage.tsx
"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Fetches a single page by ID along with related data
 * @param id - The ID of the page to fetch
 * @returns The page data with related IDs or null if not found
 */
export async function getHomePage() {


  try {
    const supabase = await createClient();
    
    // Fetch the page data along with related data
    const { data, error } = await supabase
      .from('pages')
      .select(`
        *,
        page_post (post_id),
        page_carousel (carousel_id),
        page_accordion (accordion_id),
        page_category (category_id)
      `)
      .eq('is_homepage', true)
      .single();
    
    if (error) {
      console.error('Error fetching page with related data:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getPage:', error);
    return null;
  }
}