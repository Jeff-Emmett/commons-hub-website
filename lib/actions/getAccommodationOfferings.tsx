"use server";

import { readItems, readSingleton } from "@/lib/directus/client";
import { Database } from "@/lib/database.types";

type OfferingRow = Database["public"]["Tables"]["accommodation_offerings"]["Row"];

export async function getAccommodationOfferings() {
  try {
    const data = await readItems<OfferingRow>("accommodation_offerings", {
      fields: ["*"],
      filter: { is_active: { _eq: true } },
      limit: -1,
    });
    return { error: null, accommodationOfferings: data };
  } catch (err) {
    console.error("Unexpected error in getAccommodationOfferings:", err);
    return { error: "An unexpected error occurred", accommodationOfferings: null };
  }
}

export async function getAccommodationOfferingById(id: number): Promise<OfferingRow | null> {
  if (!id) {
    console.error("Accommodation offering ID is required");
    return null;
  }
  return readSingleton<OfferingRow>("accommodation_offerings", {
    fields: ["*"],
    filter: { _and: [{ id: { _eq: id } }, { is_active: { _eq: true } }] },
  });
}
