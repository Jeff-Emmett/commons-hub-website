// lib/actions/getAccordions.tsx
"use server";

import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/database.types";
import { enhanceNestedWithImageUrls } from "@/lib/utils/imageUrlEnhancer";

// Base types from the database schema
type AccordionBase = Database['public']['Tables']['accordions']['Row'];
type AccordionItemBase = Database['public']['Tables']['accordion_items']['Row'];

// Export types for use in other components
export type AccordionItem = AccordionItemBase & {
  image_url?: string;
  // Add aliases for compatibility with component expectations
  title?: string;
  image?: string;
};

export type AccordionWithItems = AccordionBase & {
  accordion_items?: AccordionItem[];
};

/**
 * Fetches a single accordion by ID with its accordion items
 * @param id - The ID of the accordion to fetch
 * @returns The accordion data with nested items and resolved image URLs, or null if not found
 */
export async function getAccordion(id: number): Promise<AccordionWithItems | null> {
  if (!id) {
    console.error('Accordion ID is required');
    return null;
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('accordions')
      .select(`
        *,
        accordion_items (*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching accordion with items:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Enhance accordion items with image URLs
    const enhanced = await enhanceNestedWithImageUrls(
      [data],
      'accordion_items',
      'main_image',
      'image_url',
      'website-images'
    );
    
    // Map database fields to component expected fields
    if (enhanced[0]?.accordion_items) {
      enhanced[0].accordion_items = enhanced[0].accordion_items.map(item => ({
        ...item,
        title: item.header,
        image: item.main_image
      }));
    }
    
    return enhanced[0] as AccordionWithItems;
  } catch (error) {
    console.error('Unexpected error in getAccordion:', error);
    return null;
  }
}

/**
 * Fetches multiple accordions by their IDs with their accordion items
 * @param ids - Array of accordion IDs to fetch
 * @returns Array of accordion data objects with nested items and their image URLs
 */
export async function getAccordions(ids: number[]): Promise<AccordionWithItems[]> {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    console.error('Valid accordion IDs array is required');
    return [];
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('accordions')
      .select(`
        *,
        accordion_items (*)
      `)
      .in('id', ids);
    
    if (error) {
      console.error('Error fetching accordions with items:', error);
      return [];
    }
    
    if (!data || data.length === 0) return [];
    
    // Enhance accordion items with image URLs
    const enhanced = await enhanceNestedWithImageUrls(
      data,
      'accordion_items',
      'main_image',
      'image_url',
      'website-images'
    );
    
    // Map database fields to component expected fields
    enhanced.forEach(accordion => {
      if (accordion.accordion_items) {
        accordion.accordion_items = accordion.accordion_items.map(item => ({
          ...item,
          title: item.header,
          image: item.main_image
        }));
      }
    });
    
    return enhanced as AccordionWithItems[];
  } catch (error) {
    console.error('Unexpected error in getAccordions:', error);
    return [];
  }
}

/**
 * Fetches accordions by page ID using the page_accordion join table
 * @param pageId - The ID of the page to fetch accordions for
 * @returns Array of accordion data objects with nested items
 */
export async function getAccordionsByPageId(pageId: number) {
  if (!pageId) {
    console.error('Page ID is required');
    return [];
  }

  try {
    const supabase = await createClient();
    
    // First get the accordion IDs from the join table
    const { data: joinData, error: joinError } = await supabase
      .from('page_accordion')
      .select('accordion_id')
      .eq('page_id', pageId);
    
    if (joinError) {
      console.error('Error fetching accordion IDs from join table:', joinError);
      return [];
    }
    
    if (!joinData || joinData.length === 0) {
      return [];
    }
    
    // Extract accordion IDs
    const accordionIds = joinData.map(item => item.accordion_id).filter(Boolean);
    
    // Fetch the accordions with their items
    return await getAccordions(accordionIds);
  } catch (error) {
    console.error('Unexpected error in getAccordionsByPageId:', error);
    return [];
  }
}

/**
 * Fetches accordions by post ID using the post_accordion join table
 * @param postId - The ID of the post to fetch accordions for
 * @returns Array of accordion data objects with nested items
 */
export async function getAccordionsByPostId(postId: number) {
  if (!postId) {
    console.error('Post ID is required');
    return [];
  }

  try {
    const supabase = await createClient();
    
    // First get the accordion IDs from the join table
    const { data: joinData, error: joinError } = await supabase
      .from('post_accordion')
      .select('accordion_id')
      .eq('post_id', postId);
    
    if (joinError) {
      console.error('Error fetching accordion IDs from join table:', joinError);
      return [];
    }
    
    if (!joinData || joinData.length === 0) {
      return [];
    }
    
    // Extract accordion IDs
    const accordionIds = joinData.map(item => item.accordion_id).filter(Boolean);
    
    // Fetch the accordions with their items
    return await getAccordions(accordionIds);
  } catch (error) {
    console.error('Unexpected error in getAccordionsByPostId:', error);
    return [];
  }
}
