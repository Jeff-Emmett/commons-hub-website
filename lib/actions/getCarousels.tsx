// lib/actions/getCarousels.tsx
"use server";

import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/database.types";
import { enhanceNestedWithImageUrls } from "@/lib/utils/imageUrlEnhancer";

// Base types from the database schema
type CarouselBase = Database['public']['Tables']['carousels']['Row'];
type CarouselItemBase = Database['public']['Tables']['carousel_items']['Row'];

// Export types for use in other components
export type CarouselItem = CarouselItemBase & {
  image_url?: string;
};

export type CarouselWithItems = CarouselBase & {
  carousel_items?: CarouselItem[];
};

/**
 * Fetches a single carousel by ID with its carousel items
 * @param id - The ID of the carousel to fetch
 * @returns The carousel data with nested items and resolved image URLs, or null if not found
 */
export async function getCarousel(id: number): Promise<CarouselWithItems | null> {
  if (!id) {
    console.error('Carousel ID is required');
    return null;
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('carousels')
      .select(`
        *,
        carousel_items (*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching carousel with items:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Enhance carousel items with image URLs
    const enhanced = await enhanceNestedWithImageUrls(
      [data],
      'carousel_items',
      'image',
      'image_url',
      'website-images'
    );
    
    return enhanced[0] as CarouselWithItems;
  } catch (error) {
    console.error('Unexpected error in getCarousel:', error);
    return null;
  }
}

/**
 * Fetches multiple carousels by their IDs with their carousel items
 * @param ids - Array of carousel IDs to fetch
 * @returns Array of carousel data objects with nested items and their image URLs
 */
export async function getCarousels(ids: number[]): Promise<CarouselWithItems[]> {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    console.error('Valid carousel IDs array is required');
    return [];
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('carousels')
      .select(`
        *,
        carousel_items (*)
      `)
      .in('id', ids);
    
    if (error) {
      console.error('Error fetching carousels with items:', error);
      return [];
    }
    
    if (!data || data.length === 0) return [];
    
    // Enhance carousel items with image URLs
    const enhanced = await enhanceNestedWithImageUrls(
      data,
      'carousel_items',
      'image',
      'image_url',
      'website-images'
    );
    
    return enhanced as CarouselWithItems[];
  } catch (error) {
    console.error('Unexpected error in getCarousels:', error);
    return [];
  }
}

/**
 * Fetches carousels by page ID using the page_carousel join table
 * @param pageId - The ID of the page to fetch carousels for
 * @returns Array of carousel data objects with nested items
 */
// export async function getCarouselsByPageId(pageId: number) {
//   if (!pageId) {
//     console.error('Page ID is required');
//     return [];
//   }

//   try {
//     const supabase = await createClient();
    
//     // First get the carousel IDs from the join table
//     const { data: joinData, error: joinError } = await supabase
//       .from('page_carousel')
//       .select('carousel_id')
//       .eq('page_id', pageId);
    
//     if (joinError) {
//       console.error('Error fetching carousel IDs from join table:', joinError);
//       return [];
//     }
    
//     if (!joinData || joinData.length === 0) {
//       return [];
//     }
    
//     // Extract carousel IDs
//     const carouselIds = joinData.map(item => item.carousel_id).filter(Boolean);
    
//     // Fetch the carousels with their items
//     return await getCarousels(carouselIds);
//   } catch (error) {
//     console.error('Unexpected error in getCarouselsByPageId:', error);
//     return [];
//   }
// }

// /**
//  * Fetches carousels by post ID using the post_carousel join table
//  * @param postId - The ID of the post to fetch carousels for
//  * @returns Array of carousel data objects with nested items
//  */
// export async function getCarouselsByPostId(postId: number) {
//   if (!postId) {
//     console.error('Post ID is required');
//     return [];
//   }

//   try {
//     const supabase = await createClient();
    
//     // First get the carousel IDs from the join table
//     const { data: joinData, error: joinError } = await supabase
//       .from('post_carousel')
//       .select('carousel_id')
//       .eq('post_id', postId);
    
//     if (joinError) {
//       console.error('Error fetching carousel IDs from join table:', joinError);
//       return [];
//     }
    
//     if (!joinData || joinData.length === 0) {
//       return [];
//     }
    
//     // Extract carousel IDs
//     const carouselIds = joinData.map(item => item.carousel_id).filter(Boolean);
    
//     // Fetch the carousels with their items
//     return await getCarousels(carouselIds);
//   } catch (error) {
//     console.error('Unexpected error in getCarouselsByPostId:', error);
//     return [];
//   }
// }