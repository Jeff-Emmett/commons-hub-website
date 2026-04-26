// lib/actions/getPage.tsx
"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Fetches a single page by ID along with related data
 * @param id - The ID of the page to fetch
 * @returns The page data with related IDs or null if not found
 */
export async function getPageById(id: number) {
  if (!id) {
    console.error('Page ID is required');
    return null;
  }

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
      .eq('id', id)
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

/**
 * Fetches a single page by slug
 * @param slug - The slug of the page to fetch
 * @returns The page data or null if not found
 */
export async function getPageBySlug(slug: string) {
  if (!slug) {
    console.error('Page slug is required');
    return null;
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('pages')
      .select(`
        *,
        page_post (post_id),
        page_carousel (carousel_id),
        page_accordion (accordion_id),
        page_category (category_id)
      `)
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.error('Error fetching page by slug:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getPageBySlug:', error);
    return null;
  }
}

/**
 * Fetches the homepage by is_homepage along with related data
 * @returns The homepage data with related IDs or null if not found
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

/**
 * Fetches all pages for the admin panel with basic information
 * @returns Array of pages with basic information for admin listing or null if error
 */
export async function getPages() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('pages')
      .select('id, title, slug, status')
      .order('sort', { ascending: true });
    
    if (error) {
      console.error('Error fetching pages:', error);
      return { error: error.message, pages: null };
    }

    return { error: null, pages: data };
  } catch (error) {
    console.error('Unexpected error in getPages:', error);
    return { error: 'An unexpected error occurred', pages: null };
  }
}