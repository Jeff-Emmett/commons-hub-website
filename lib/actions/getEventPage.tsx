// lib/actions/getEventPage.tsx
"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Fetches a single event page by ID along with related data
 * @param id - The ID of the event page to fetch
 * @returns The event page data or null if not found
 */
export async function getEventPageById(id: number) {
  if (!id) {
    console.error('Event page ID is required');
    return null;
  }

  try {
    const supabase = await createClient();
    
    // Fetch the event page data
    const { data, error } = await supabase
      .from('eventpages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching event page:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getEventPageById:', error);
    return null;
  }
}

/**
 * Fetches a single event page by slug
 * @param slug - The slug of the event page to fetch
 * @returns The event page data or null if not found
 */
export async function getEventPageBySlug(slug: string) {
  if (!slug) {
    console.error('Event page slug is required');
    return null;
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('eventpages')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.error('Error fetching event page by slug:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getEventPageBySlug:', error);
    return null;
  }
}

/**
 * Fetches a single event by ID
 * @param id - The ID of the event to fetch
 * @returns The event data or null if not found
 */
export async function getEvent(id: number) {
  if (!id) {
    console.error('Event ID is required');
    return null;
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('eventpages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching event:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getEvent:', error);
    return null;
  }
}

/**
 * Fetches published events with optional filtering for upcoming or past
 * @param filter - Optional filter: 'upcoming', 'past', or undefined for all published events
 * @returns Array of published event data objects
 */
export async function getEventPage(filter?: 'upcoming' | 'past') {
  try {
    
    const supabase = await createClient();
    let query = supabase
      .from('eventpages')
      .select('*')
      .eq('status', 'published'); // Always filter for published events
    
    // Apply date filters if specified
    const today = new Date().toISOString();
    if (filter === 'upcoming') {
      // For upcoming events, the end date should be in the future
      query = query.gt('enddatetime', today);
    } else if (filter === 'past') {
      // For past events, the end date should be in the past
      query = query.lt('enddatetime', today);
    }
    
    // Order by appropriate date field based on filter
    if (filter === 'past') {
      // For past events, order by end date with most recent first
      query = query.order('enddatetime', { ascending: false });
      console.log("Past events: ", query)
    } else {
      // For upcoming or all events, order by start date with soonest first
      query = query.order('startdatetime', { ascending: true });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getEventPage:', error);
    return [];
  }
}
