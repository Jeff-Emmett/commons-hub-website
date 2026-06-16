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
    image: "8c809368-1ad5-4e56-b837-5b44df57b278",
    title: "Lounge",
    body:
      "The heart of the house — vintage couches, a vinyl record player, board games, and a community library.",
  },
  {
    image: "207602ff-b38e-4ff1-aab4-85aaeb57dce5",
    title: "Kitchen",
    body:
      "Once a restaurant kitchen — now home to late-night cooking sessions. Stocked with enough pots and pans to feed a small revolution.",
  },
  {
    image: "bba4dbc0-3e0a-4a4f-b449-66d38332baae",
    title: "Garden",
    body:
      "Spacious enough for frisbee sessions, with a fire bowl, veggie gardens, and a hand-crafted spa area* with views on the nearby mountain tops <em>(*optional access)</em>.",
  },
];

export const ROOMS: SideSlide[] = [
  {
    image: "d3ebf384-eade-4d7e-8ec9-26489219f357",
    title: "Double Room (twin beds)",
    body: "Two single beds, a cupboard, a desk and a sink. Comfortable for colleagues or friends travelling together.",
  },
  {
    image: "65ddcb30-4628-4d25-bed5-bca14cf92dd9",
    title: "Double Room (kingsize bed)",
    body: "One large bed for couples or anyone who likes room to stretch out.",
  },
  {
    // photo swapped with 6-Bed Room per spec (images were mismatched)
    image: "bd181230-3e85-4097-943c-862ddbe4720a",
    title: "Quadruple Room",
    body: "Four beds — ideal for a small team or a group of friends sharing.",
  },
  {
    image: "bf764a3d-79b1-41a4-96e3-2407bf4aecec",
    title: "6-Bed Room",
    body: "Our most social option — six beds, dorm-style, the friendliest price.",
  },
];

export const EVENT_SPACES: SideSlide[] = [
  {
    image: "e622aeb9-d965-4c91-94b9-4afa01e2ad3d",
    title: "90 m² Conference Hall",
    body:
      "With stage, piano, A/V, lights & livestream setup.",
  },
  {
    image: "04f111ce-b393-4007-ab9c-7945d09bbfcd",
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
