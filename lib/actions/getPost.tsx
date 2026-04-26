// lib/actions/getPosts.tsx
"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Fetches a single post by ID
 * @param id - The ID of the post to fetch
 * @returns The post data or null if not found
 */
export async function getPost(id: number) {
  if (!id) {
    console.error('Post ID is required');
    return null;
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_carousel (carousel_id),
        post_accordion (accordion_id)
      `)
      .eq('id', id)
      .eq('status', 'published')
      .gte('valid_to', new Date().toISOString())
      .single();
    
    if (error) {
      console.error('Error fetching post with related data:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getPost:', error);
    return null;
  }
}

/**
 * Fetches multiple posts by their IDs
 * @param ids - Array of post IDs to fetch
 * @returns Array of post data objects
 */
export async function getPosts(ids: number[]) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    console.error('Valid post IDs array is required');
    return [];
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_carousel (carousel_id),
        post_accordion (accordion_id)
      `)
      .in('id', ids)
      .eq('status', 'published')
      .gte('valid_to', new Date().toISOString());
    
    if (error) {
      console.error('Error fetching posts with related data:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getPosts:', error);
    return [];
  }
}

/**
 * Fetches all published posts with their related data
 * @returns Array of published posts
 */
export async function getAllPublishedPosts() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_carousel (carousel_id),
        post_accordion (accordion_id)
      `)
      .eq('status', 'published')
      .gte('valid_to', new Date().toISOString())
      .order('date_created', { ascending: false });
    
    if (error) {
      console.error('Error fetching published posts:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Unexpected error in getAllPublishedPosts:', error);
    return [];
  }
}

/**
 * Get all posts with basic information for admin panel
 * @returns Object with error and posts array
 */
export async function getPostList() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, slug, status, date_created, date_updated')
      .gte('valid_to', new Date().toISOString())
      .eq('status', 'published')
      .order('date_created', { ascending: false })
    
    if (error) {
      console.error('Error fetching posts:', error)
      return { error: error.message, posts: [] }
    }
    
    return { error: null, posts: data }
  } catch (error) {
    console.error('Error in getPostList:', error)
    return { error: 'An unexpected error occurred', posts: [] }
  }
}

/**
 * Get a single post by ID with all details for admin editing
 * @param id - The ID of the post to fetch
 * @returns Object with error and post data
 */
export async function getPostById(id: number) {
  try {
    const supabase = await createClient()
    
    // Fetch the post data
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .gte('valid_to', new Date().toISOString())
      .eq('status', 'published')
      .single()
    
    if (error) {
      console.error('Error fetching post by ID:', error)
      return { error: error.message, post: null }
    }
    
    // Fetch associated categories for this post
    const { data: categoryData, error: categoryError } = await supabase
      .from('category_post')
      .select('category_id')
      .eq('post_id', id)
    
    if (categoryError) {
      console.error('Error fetching post categories:', categoryError)
      return { error: null, post: data, categories: [] }
    }
    
    return { 
      error: null, 
      post: data, 
      categories: categoryData?.map(item => item.category_id) || [] 
    }
  } catch (error) {
    console.error('Error in getPostById:', error)
    return { error: 'An unexpected error occurred', post: null, categories: [] }
  }
}

/**
 * Fetches a single post by slug with related data
 * @param slug - The slug of the post to fetch
 * @returns The post data or null if not found
 */
export async function getPostBySlug(slug: string) {
  if (!slug) {
    console.error('Post slug is required');
    return null;
  }

  try {
    const supabase = await createClient();
    
    // First get the post data
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_carousel (carousel_id),
        post_accordion (accordion_id)
      `)
      .eq('slug', slug)
      .gte('valid_to', new Date().toISOString())
      .eq('status', 'published')
      .single();
    
    if (error) {
      console.error('Error fetching post by slug:', error);
      return null;
    }
    
    // Restructure the data to match what the page component expects
    // The page is looking for category_carousel and category_accordion
    const restructuredData = {
      ...data,
      category_carousel: data.post_carousel,
      category_accordion: data.post_accordion,
      category_post: [] // Empty array as placeholder for category_post
    };

    return restructuredData;
  } catch (error) {
    console.error('Unexpected error in getPostBySlug:', error);
    return null;
  }
}