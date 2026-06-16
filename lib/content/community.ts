// Structural content for the Community page. Verbatim-editable copy lives here
// (same pattern as lib/content/venue.ts). Replace `href: null` with the real
// URL once confirmed — left null so we never ship a wrong external link.
// `logo` is a Directus file UUID or absolute URL; null renders a placeholder.

export interface CommunityEntity {
  name: string;
  /** One-line description. Keep it plain — no marketing fluff. */
  blurb: string;
  /** External link, or null until the URL is confirmed (TODO). */
  href: string | null;
  /** Directus asset UUID / absolute URL for a logo, or null for a placeholder. */
  logo: string | null;
}

// De-kitsched intro (replaces "harbors artists, dreamers, hackers and
// tinkerers — together with the partners and sponsors who make the place
// possible.").
export const COMMUNITY_INTRO =
  "The Commons Hub is run by the people who use it. Several associations are " +
  "based here, and we work in an open network of partner spaces across Europe " +
  "that share our approach to commons, community and regeneration.";

// "Local Associations hosted at the Hub" (spec 4c).
export const LOCAL_ASSOCIATIONS: CommunityEntity[] = [
  {
    name: "Crypto Commons Association (e.V.)",
    blurb: "Research and gatherings on crypto, commons and public goods.",
    href: "https://www.crypto-commons.org/",
    logo: null,
  },
  {
    name: "Valley of the Commons (e.V.)",
    blurb: "Local association stewarding the valley as a shared resource.",
    href: "https://valleyofthecommons.com/",
    logo: null,
  },
  {
    name: "FabLab Association",
    blurb: "Open workshop and maker space — contact: Stefan.",
    href: null, // TODO: no public site found — confirm a URL with Stefan
    logo: null,
  },
  {
    name: "Digital Engineering",
    blurb: "Engineering and digital-fabrication projects based at the Hub.",
    href: null, // TODO: no public site found — confirm the entity/URL
    logo: null,
  },
  // Future: EthicAI (spec 4c-v) — add once founded.
];

// "Name some of our partners" (spec 4d). Sponsors intentionally omitted
// until we actually have sponsors (spec 4e).
export const PARTNERS: CommunityEntity[] = [
  { name: "Hubs Network",    blurb: "Network connecting physical hubs and digital communities — the Commons Hub is a member.", href: "https://www.hubsnetwork.org/", logo: null },
  { name: "ReFi DAO",        blurb: "Regenerative finance community.",            href: "https://refidao.com/", logo: null },
  { name: "Akasha Hub",      blurb: "Decentralised community space in Barcelona.", href: "https://akasha.barcelona/", logo: null },
  { name: "Commons Hub Brussels", blurb: "Sister hub in Brussels.",               href: "https://commonshub.brussels/", logo: null },
  { name: "Liminal Village", blurb: "Open-source eco-tech co-living hub in Italy.", href: "https://liminalvillage.com/", logo: null },
  { name: "Traditional Dream Factory", blurb: "Regenerative village in Alentejo, Portugal.", href: "https://www.traditionaldreamfactory.com/", logo: null },
  { name: "Digital Arts / Angewandte", blurb: "Digital Arts at the University of Applied Arts Vienna.", href: "https://www.dieangewandte.at/en/institutes/fine_arts_and_media_art/digital_arts", logo: null },
];
