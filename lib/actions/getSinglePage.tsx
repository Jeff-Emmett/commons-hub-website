// lib/actions/getSinglePage.tsx
"use server";

import { createClient } from "@/lib/supabase/server";
import { getCategoriesByPageId } from "./getCategory";

/**
 * Fetches a single page by slug along with related data
 * @param slug - The slug of the page to fetch
 * @returns The page data with related data or null if not found
 */
export async function getSinglePage(slug: string) {
  if (!slug) {
    console.error('Page slug is required');
    return null;
  }

  try {
    const supabase = await createClient();
    
    // Fetch the page data
    const { data: page, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.error('Error fetching page by slug:', error);
      return null;
    }
    
    if (!page) {
      return null;
    }

    // Fetch related data
    const [categories, carousels, accordions] = await Promise.all([
      fetchCategories(page.id),
      fetchCarousels(page.id),
      fetchAccordions(page.id)
    ]);

    // Combine all data
    const pageWithRelations = {
      ...page,
      categories,
      carousel: carousels,
      accordions
    };

    return pageWithRelations;
  } catch (error) {
    console.error('Unexpected error in getSinglePage:', error);
    return null;
  }
}

/**
 * Helper function to fetch categories related to a page
 */
async function fetchCategories(pageId: number) {
  try {
    const categories = await getCategoriesByPageId(pageId);
    return categories;
  } catch (error) {
    console.error('Error fetching categories for page:', error);
    return [];
  }
}

/**
 * Helper function to fetch carousels related to a page
 */
async function fetchCarousels(pageId: number) {
  try {
    const supabase = await createClient();
    
    // Get carousel IDs from the join table
    const { data: joinData, error: joinError } = await supabase
      .from('page_carousel')
      .select('carousel_id')
      .eq('page_id', pageId);
    
    if (joinError || !joinData || joinData.length === 0) {
      return [];
    }
    
    // Extract carousel IDs
    const carouselIds = joinData.map(item => item.carousel_id).filter(Boolean);
    
    // Fetch the carousels
    const { data: carousels, error } = await supabase
      .from('carousels')
      .select('*')
      .in('id', carouselIds);
    
    if (error) {
      console.error('Error fetching carousels:', error);
      return [];
    }
    
    return carousels || [];
  } catch (error) {
    console.error('Error fetching carousels for page:', error);
    return [];
  }
}

/**
 * Helper function to fetch accordions related to a page
 */
async function fetchAccordions(pageId: number) {
  try {
    const supabase = await createClient();
    
    // Get accordion IDs from the join table
    const { data: joinData, error: joinError } = await supabase
      .from('page_accordion')
      .select('accordion_id')
      .eq('page_id', pageId);
    
    if (joinError || !joinData || joinData.length === 0) {
      return [];
    }
    
    // Extract accordion IDs
    const accordionIds = joinData.map(item => item.accordion_id).filter(Boolean);
    
    // Fetch the accordions
    const { data: accordions, error } = await supabase
      .from('accordions')
      .select('*')
      .in('id', accordionIds);
    
    if (error) {
      console.error('Error fetching accordions:', error);
      return [];
    }
    
    return accordions || [];
  } catch (error) {
    console.error('Error fetching accordions for page:', error);
    return [];
  }
}
