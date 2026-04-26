// lib/actions/getCategories.tsx
"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Fetches a single category by ID
 * @param id - The ID of the category to fetch
 * @returns The category data or null if not found
 */
export async function getCategoryById(id: number) {
  if (!id) {
    console.error('Category ID is required');
    return null;
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        category_post (post_id),
        category_carousel (carousel_id),
        category_accordion (accordion_id)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching category:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getCategory:', error);
    return null;
  }
}

/**
 * Fetches multiple categories by their IDs
 * @param ids - Array of category IDs to fetch
 * @returns Array of category data objects
 */
export async function getCategories(ids: number[]) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    console.error('Valid category IDs array is required');
    return [];
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        category_post (post_id),
        category_carousel (carousel_id),
        category_accordion (accordion_id)
      `)
      .in('id', ids);
    
    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getCategories:', error);
    return [];
  }
}

/**
 * Fetches categories by page ID using the page_category join table
 * @param pageId - The ID of the page to fetch categories for
 * @returns Array of category data objects
 */
export async function getCategoriesByPageId(pageId: number) {
  if (!pageId) {
    console.error('Page ID is required');
    return [];
  }

  try {
    const supabase = await createClient();
    
    // First get the category IDs from the join table
    const { data: joinData, error: joinError } = await supabase
      .from('page_category')
      .select('category_id')
      .eq('page_id', pageId);
    
    if (joinError) {
      console.error('Error fetching category IDs from join table:', joinError);
      return [];
    }
    
    if (!joinData || joinData.length === 0) {
      return [];
    }
    
    // Extract category IDs
    const categoryIds = joinData.map(item => item.category_id).filter(Boolean);
    
    // Fetch the categories
    return await getCategories(categoryIds);
  } catch (error) {
    console.error('Unexpected error in getCategoriesByPageId:', error);
    return [];
  }
}

/**
 * Fetches categories by post ID using the post_category join table
 * @param postId - The ID of the post to fetch categories for
 * @returns Array of category data objects
 */
export async function getCategoriesByPostId(postId: number) {
  if (!postId) {
    console.error('Post ID is required');
    return [];
  }

  try {
    const supabase = await createClient();
    
    // First get the category IDs from the join table
    const { data: joinData, error: joinError } = await supabase
      .from('category_post') // Using the correct table name from the database
      .select('category_id')
      .eq('post_id', postId);
    
    if (joinError) {
      console.error('Error fetching category IDs from join table:', joinError);
      return [];
    }
    
    if (!joinData || joinData.length === 0) {
      return [];
    }
    
    // Extract category IDs
    const categoryIds = joinData.map(item => item.category_id).filter(Boolean);
    
    // Fetch the categories
    return await getCategories(categoryIds);
  } catch (error) {
    console.error('Unexpected error in getCategoriesByPostId:', error);
    return [];
  }
}

/**
 * Fetches a single category by slug
 * @param slug - The slug of the category to fetch
 * @returns The category data or null if not found
 */
export async function getCategoryBySlug(slug: string) {
  if (!slug) {
    console.error('Category slug is required');
    return null;
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        category_post (post_id),
        category_carousel (carousel_id),
        category_accordion (accordion_id)
      `)
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.error('Error fetching category by slug:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getCategoryBySlug:', error);
    return null;
  }
}


/**
 * Get all categories with basic information
 */
export async function getCategoryList() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('categories')
      .select('id, title, slug, status')
      .order('sort', { ascending: true });
    
    if (error) {
      console.error('Error fetching categories:', error)
      return { error: error.message, categories: [] }
    }
    
    return { error: null, categories: data }
  } catch (error) {
    console.error('Error in getCategories:', error)
    return { error: 'An unexpected error occurred', categories: [] }
  }
}