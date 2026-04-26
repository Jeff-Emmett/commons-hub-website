// lib/actions/getAccommodationOfferings.tsx
"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Fetches all active accommodation offerings
 * @returns Array of active accommodation offerings or null if error
 */
export async function getAccommodationOfferings() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('accommodation_offerings')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching accommodation offerings:', error);
      return { error: error.message, accommodationOfferings: null };
    }

    return { error: null, accommodationOfferings: data };
  } catch (error) {
    console.error('Unexpected error in getAccommodationOfferings:', error);
    return { error: 'An unexpected error occurred', accommodationOfferings: null };
  }
}

/**
 * Fetches a single accommodation offering by ID
 * @param id - The ID of the accommodation offering to fetch
 * @returns The accommodation offering data or null if not found
 */
export async function getAccommodationOfferingById(id: number) {
  if (!id) {
    console.error('Accommodation offering ID is required');
    return null;
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('accommodation_offerings')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('Error fetching accommodation offering by ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getAccommodationOfferingById:', error);
    return null;
  }
}