"use server";

import { readItems, readSingleton } from "@/lib/directus/client";
import { Database } from "@/lib/database.types";

type TeamRow = Database["public"]["Tables"]["team_members"]["Row"];

export async function getTeam(): Promise<TeamRow[]> {
  return readItems<TeamRow>("team_members", {
    fields: ["*"],
    sort: "sort",
    limit: -1,
  });
}

export async function getTeamMember(id: number): Promise<TeamRow | null> {
  if (!id) {
    console.error("Team member ID is required");
    return null;
  }
  return readSingleton<TeamRow>("team_members", {
    fields: ["*"],
    filter: { id: { _eq: id } },
  });
}
