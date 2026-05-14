"use server";

import { readItems, readSingleton } from "@/lib/directus/client";
import { Database } from "@/lib/database.types";

type EventRow = Database["public"]["Tables"]["eventpages"]["Row"];

const EVENT_FIELDS = ["*"];

export async function getEventPageById(id: number): Promise<EventRow | null> {
  if (!id) {
    console.error("Event page ID is required");
    return null;
  }
  return readSingleton<EventRow>("eventpages", {
    fields: EVENT_FIELDS,
    filter: { id: { _eq: id } },
  });
}

export async function getEventPageBySlug(slug: string): Promise<EventRow | null> {
  if (!slug) {
    console.error("Event page slug is required");
    return null;
  }
  return readSingleton<EventRow>("eventpages", {
    fields: EVENT_FIELDS,
    filter: { slug: { _eq: slug } },
  });
}

export async function getEvent(id: number) {
  return getEventPageById(id);
}

export async function getEventPage(filter?: "upcoming" | "past"): Promise<EventRow[]> {
  const today = new Date().toISOString();
  const baseFilter: Record<string, unknown> = { status: { _eq: "published" } };

  if (filter === "upcoming") {
    return readItems<EventRow>("eventpages", {
      fields: EVENT_FIELDS,
      filter: { _and: [baseFilter, { enddatetime: { _gt: today } }] },
      sort: "startdatetime",
      limit: -1,
    });
  }
  if (filter === "past") {
    return readItems<EventRow>("eventpages", {
      fields: EVENT_FIELDS,
      filter: { _and: [baseFilter, { enddatetime: { _lt: today } }] },
      sort: "-enddatetime",
      limit: -1,
    });
  }
  return readItems<EventRow>("eventpages", {
    fields: EVENT_FIELDS,
    filter: baseFilter,
    sort: "startdatetime",
    limit: -1,
  });
}
