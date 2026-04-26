// lib/actions/getTeam.tsx
"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Fetches all team members
 * @returns Array of team member data objects
 */
export async function getTeam() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('sort', { ascending: true });
    
    if (error) {
      console.error('Error fetching team members:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getTeam:', error);
    return [];
  }
}

/**
 * Fetches a single team member by ID
 * @param id - The ID of the team member to fetch
 * @returns The team member data or null if not found
 */
export async function getTeamMember(id: number) {
  if (!id) {
    console.error('Team member ID is required');
    return null;
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching team member:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getTeamMember:', error);
    return null;
  }
}