// Hardcoded structural content for the Accommodation / Event Venue pages.
// Copy is verbatim from the spec; image values are Directus file UUIDs
// (swap any UUID here to change a photo — no code changes needed).
import type { SideSlide } from "@/components/SideCarousel";
import type { PinnedSlide } from "@/components/journey/PinnedCarousel";

const ASSET_BASE = (
  process.env.NEXT_PUBLIC_DIRECTUS_URL || "https://admin.commons-hub.at"
).replace(/\/$/, "");

/** Resolve {image: uuid, title, body} -> PinnedCarousel slide. */
export function toPinned(slides: SideSlide[]): PinnedSlide[] {
  return slides.map((s) => ({
    imageUrl: s.image.startsWith("http")
      ? s.image
      : `${ASSET_BASE}/assets/${s.image}`,
    title: s.title,
    body: s.body,
  }));
}

// Shared by both the Accommodation and Event Venue pages (spec).
export const COMMON_AREAS: SideSlide[] = [
  {
    image: "48c365d2-e9f7-42ce-bc4e-49cca6b8299c",
    title: "Lounge",
    body:
      "The heart of the house — vintage couches, a vinyl record player, board games, and a community library.",
  },
  {
    image: "80f5e81f-5b1a-4c06-b74d-be0c4f1cb62f",
    title: "Kitchen",
    body:
      "Once a restaurant kitchen — now home to late-night cooking sessions. Stocked with enough pots and pans to feed a small revolution.",
  },
  {
    image: "8b60bc3d-0411-40c7-9970-832d583aef24",
    title: "Garden",
    body:
      "Spacious enough for frisbee sessions, with a fire bowl, veggie gardens, and a hand-crafted spa area* with views on the nearby mountain tops <em>(*optional access)</em>.",
  },
];

export const ROOMS: SideSlide[] = [
  {
    image: "496f4b23-4e16-47f7-a508-5c270e7aaea2",
    title: "Double Room (twin beds)",
    body: "Two single beds, a cupboard, a desk and a sink. Comfortable for colleagues or friends travelling together.",
  },
  {
    image: "80f5e81f-5b1a-4c06-b74d-be0c4f1cb62f",
    title: "Double Room (kingsize bed)",
    body: "One large bed for couples or anyone who likes room to stretch out.",
  },
  {
    image: "4ab5375d-4d7c-4509-991f-4f1fbdc2d4a0",
    title: "Quadruple Room",
    body: "Four beds — ideal for a small team or a group of friends sharing.",
  },
  {
    image: "df70fb04-c9d2-433d-8446-9cf8a0e8b629",
    title: "6-Bed Room",
    body: "Our most social option — six beds, dorm-style, the friendliest price.",
  },
];

export const EVENT_SPACES: SideSlide[] = [
  {
    image: "f6e38335-40a6-4b4c-bfc3-6471c067c38f",
    title: "90 m² Conference Hall",
    body:
      "With stage, piano, A/V, lights & livestream setup.",
  },
  {
    image: "4e7c8805-b7f5-4743-ba18-aa44ebf99568",
    title: "90 m² Maker Hall",
    body:
      "With laser cutter, 3D printer, sound lab, ping-pong & foosball.",
  },
  {
    image: "01de3901-23c4-4369-9854-9c6fe05ff9fb",
    title: "45 m² Seminar Room",
    body:
      "With TV screen and flipchart — ideal for classes and smaller workshops.",
  },
];
