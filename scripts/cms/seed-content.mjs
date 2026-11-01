// The content that used to be hardcoded in the page components, as it was on
// the live site on 2026-11-01. directus-migrate-content.mjs writes it into
// Directus ONCE per section/item (it never overwrites what an editor changed).
// After that Directus is the only source; this file is history, not a fallback.
//
// `i18n` maps a field to a key in messages/<locale>.json whose translations are
// copied into the item's Directus translations (the English text must match).

const WIKI_BASE = '#'; // the old surroundings page linked "#/nature" etc. until the wiki exists

export const SITE_SETTINGS = {
  site_name: 'Commons Hub',
  contact_email: 'office@commons-hub.at',
  address: 'Richard von Schoeller-Straße 9\n2651 Reichenau an der Rax\nAustria',
  telegram_url: 'https://t.me/joinchat/Vcg9sAXnJ1XY5BBn',
  x_url: 'https://x.com/CommonsHubAT',
  instagram_url: 'https://www.instagram.com/commonshub/',
  youtube_url: 'http://www.youtube.com/@CommonsHub',
  instagram_handle: 'commonshub',
  seo_title_default: 'Event Venue & Co-Living in the Austrian Alps | Commons Hub',
  seo_title_suffix: ' | Commons Hub',
  seo_description:
    'The Commons-Hub is a co-working, co-living and event venue in the Austrian Alps that harbours artists, digital movements and decentralized communities exploring the liberatory potential of emerging technologies.',
  og_title: 'Commons Hub',
  og_description:
    'The Commons-Hub is an experimental playground for regenerative systems design in the Austrian Alps that harbours artists, digital movements and decentralized communities.',
  twitter_description: 'The Commons-Hub is a co-working, co-living and event venue in the Austrian Alps.',
  og_image: null,
  event_fallback_image: 'f6e38335-40a6-4b4c-bfc3-6471c067c38f',
};

const COMMON_AREAS = [
  {
    image: '8c809368-1ad5-4e56-b837-5b44df57b278',
    title: 'Lounge',
    text: 'The heart of the house — vintage couches, a vinyl record player, board games, and a community library.',
  },
  {
    image: '207602ff-b38e-4ff1-aab4-85aaeb57dce5',
    title: 'Kitchen',
    text: 'Once a restaurant kitchen — now home to late-night cooking sessions. Stocked with enough pots and pans to feed a small revolution.',
  },
  {
    image: 'bba4dbc0-3e0a-4a4f-b449-66d38332baae',
    title: 'Garden',
    text: 'Spacious enough for frisbee sessions, with a fire bowl, veggie gardens, and a hand-crafted spa area* with views on the nearby mountain tops <em>(*optional access)</em>.',
  },
];

const entity = (title, text, link) => ({ title, text, link });

/**
 * Pages and their sections. `id` targets an existing pages row; rows without an
 * id are created (they are hand-designed routes that had no CMS row before).
 */
export const PAGES = [
  {
    id: 202,
    slug: 'home',
    fixed_route: '/',
    sections: [
      {
        key: 'tiles',
        placement: 'Home page — the four picture tiles under the slideshow. (The slideshow itself is Building blocks → Carousels → "home_hero".)',
        items: [
          { title: 'Book your Stay', link: '/accommodation', image: 'dfa256d9-8691-4491-aeeb-e21150921494', i18n: { title: 'home.bookStay' } },
          { title: 'Plan your Retreat', link: '/event-venue', image: 'f5d57b34-9a42-44ee-834b-5aae6453d56d', i18n: { title: 'home.planRetreat' } },
          {
            title: 'Upcoming Events', link: '/events', image: 'f5d57b34-9a42-44ee-834b-5aae6453d56d', i18n: { title: 'home.upcomingEvents' },
            hint: 'Shows the photo of the next upcoming event automatically; this image is used when there is none.',
          },
          { title: 'Read More', link: '/about', image: '728e404d-4a88-4ce2-b623-1654d21cfef9', i18n: { title: 'home.readMore' } },
        ],
      },
      {
        key: 'blog',
        placement: 'Home page — heading above the row of blog posts (the posts come from Blog & Events → Posts).',
        heading: 'Latest from the blog',
        i18n: { heading: 'home.latestFromBlog' },
      },
      {
        key: 'gallery_preview',
        placement: 'Home page — photo preview at the bottom (photos come from the Gallery carousels).',
        heading: 'From the gallery',
        button_label: 'View all photos →',
        button_link: '/gallery',
      },
    ],
  },
  {
    id: 204,
    slug: 'accommodation',
    fixed_route: '/accommodation',
    seo: {
      seo_title_tag: 'Accommodation',
      seo_description: 'Not a hotel — a communal guesthouse in the Austrian Alps. Rooms, common areas, and a place to slow down and feel at home.',
    },
    sections: [
      {
        key: 'rooms',
        placement: 'Accommodation page — the first scrolling slideshow.',
        heading: 'Our Rooms',
        items: [
          { image: 'd3ebf384-eade-4d7e-8ec9-26489219f357', title: 'Double Room (twin beds)', text: 'Two single beds, a cupboard, a desk and a sink. Comfortable for colleagues or friends travelling together.' },
          { image: '65ddcb30-4628-4d25-bed5-bca14cf92dd9', title: 'Double Room (kingsize bed)', text: 'One large bed for couples or anyone who likes room to stretch out.' },
          { image: 'bd181230-3e85-4097-943c-862ddbe4720a', title: 'Quadruple Room', text: 'Four beds — ideal for a small team or a group of friends sharing.' },
          { image: 'bf764a3d-79b1-41a4-96e3-2407bf4aecec', title: '6-Bed Room', text: 'Our most social option — six beds, dorm-style, the friendliest price.' },
        ],
      },
      {
        key: 'common_areas',
        placement: 'Second scrolling slideshow on BOTH the Accommodation and the Event Venue page.',
        heading: 'Common Areas',
        items: COMMON_AREAS,
      },
      {
        key: 'booking',
        placement: 'Accommodation page — heading above the booking form. (Room prices: Settings → Booking prices.)',
        heading: 'Book your stay',
      },
    ],
  },
  {
    id: 206,
    slug: 'venue',
    fixed_route: '/event-venue',
    seo: {
      seo_title_tag: 'Event Venue',
      seo_description: 'Host your event at the commons hub — events as commons, shaped by mutual care and respect among peers.',
    },
    sections: [
      {
        key: 'event_spaces',
        placement: 'Event Venue page — the first scrolling slideshow. (The "Common Areas" slideshow below it is edited on the Accommodation page.)',
        heading: 'Event Spaces',
        items: [
          { image: 'e622aeb9-d965-4c91-94b9-4afa01e2ad3d', title: '90 m² Conference Hall', text: 'With stage, piano, A/V, lights & livestream setup.' },
          { image: '04f111ce-b393-4007-ab9c-7945d09bbfcd', title: '90 m² Maker Hall', text: 'With laser cutter, 3D printer, sound lab, ping-pong & foosball.' },
          { image: '01de3901-23c4-4369-9854-9c6fe05ff9fb', title: '45 m² Seminar Room', text: 'With TV screen and flipchart — ideal for classes and smaller workshops.' },
        ],
      },
      {
        key: 'booking',
        placement: 'Event Venue page — booking form heading, and the toolbox button + text under the form. (Package prices: Settings → Booking prices.)',
        heading: 'Book Event Space',
        button_label: 'Event Organizer Toolbox',
        button_link: '/event-toolbox',
        text: 'Need help with organizing? We got ample experience — check our free templates.',
      },
    ],
  },
  {
    id: 155,
    slug: 'events',
    fixed_route: '/events',
    seo: {
      seo_title_tag: 'Events',
      seo_description: 'Upcoming gatherings, hackathons and residencies at the Commons Hub in the Austrian Alps.',
    },
    sections: [
      { key: 'intro', placement: 'Events page — page heading.', heading: 'Events' },
      { key: 'upcoming', placement: 'Events page — upcoming events row (events come from Blog & Events → Events).', heading: 'Upcoming Events', nav_label: 'Upcoming Events' },
      {
        key: 'calendar', placement: 'Events page — list of all planned events.', heading: 'Event Calendar', nav_label: 'Event Calendar',
        text: 'No planned events yet.',
      },
      { key: 'past', placement: 'Events page — past events row.', heading: 'Past Events', nav_label: 'Past Events' },
    ],
  },
  {
    id: 159,
    slug: 'about',
    fixed_route: '/about',
    seo: {
      seo_title_tag: 'About',
      seo_description: 'The team, community, history and contact details behind the Commons Hub.',
    },
    sections: [
      { key: 'team', placement: 'About page — team slider (people: Building blocks → Team).', heading: 'Team', nav_label: 'Team' },
      {
        key: 'history',
        placement: 'About page — History. Each item is a sub-heading with its paragraph.',
        heading: 'History',
        nav_label: 'History',
        items: [
          { title: 'The House', text: 'Built in 1860 as a countryside inn, the house was transformed into an artist colony in 2013. It has hosted retreats and gatherings since 2020, and was formalized as the Commons Hub in 2023.' },
          { title: 'The Village', text: 'Reichenau an der Rax was a 19th-century summer residence of the nobility — leaving behind dozens of villas, castles and pavilions. Hirschwang, the tiny village the Commons Hub sits in, always stayed industrial: wood, iron ore, a battery factory and a paper mill. Both villages have been in slow decay ever since — the ground we\'re now helping to bring back to life.' },
        ],
      },
      { key: 'contact', placement: 'About page — Contact (address and email: Settings → Site settings).', heading: 'Contact', nav_label: 'Contact' },
    ],
  },
  {
    id: 208,
    slug: 'blog',
    fixed_route: '/blog',
    seo: {
      seo_title_tag: 'Blog',
      seo_description: 'Field notes from the Commons Hub — gatherings, residencies, and reflections from the Austrian Alps.',
    },
    sections: [
      {
        key: 'writing', placement: 'Blog page — heading of the post grid; the text is shown while there are no posts.',
        heading: 'Blog', nav_label: 'Latest writing', text: 'No posts yet — check back soon.',
      },
      { key: 'instagram', placement: 'Blog page — Instagram section (account: Settings → Site settings).', nav_label: 'Instagram' },
    ],
  },
  {
    slug: 'community-partners',
    title: 'Community & Partners',
    fixed_route: '/community',
    seo: {
      seo_title_tag: 'Community',
      seo_description: 'The associations based at the Commons Hub and the network of partner spaces we work with.',
    },
    sections: [
      {
        key: 'intro', placement: 'Community page — heading and intro.',
        heading: 'Community',
        text: 'The Commons Hub is run by the people who use it. Several associations are based here, and we work in an open network of partner spaces across Europe that share our approach to commons, community and regeneration.',
      },
      {
        key: 'associations', placement: 'Community page — association cards (image = logo; empty link = not clickable).',
        heading: 'Associations hosted at the Hub',
        items: [
          entity('Crypto Commons Association (e.V.)', 'Research and gatherings on crypto, commons and public goods.', 'https://www.crypto-commons.org/'),
          entity('Valley of the Commons (e.V.)', 'Local association stewarding the valley as a shared resource.', 'https://valleyofthecommons.com/'),
          entity('FabLab Association', 'Open workshop and maker space — contact: Stefan.', null),
          entity('Digital Engineering', 'Engineering and digital-fabrication projects based at the Hub.', null),
        ],
      },
      {
        key: 'partners', placement: 'Community page — partner cards (image = logo).',
        heading: 'Partners',
        items: [
          entity('Hubs Network', 'Network connecting physical hubs and digital communities — the Commons Hub is a member.', 'https://www.hubsnetwork.org/'),
          entity('ReFi DAO', 'Regenerative finance community.', 'https://refidao.com/'),
          entity('Akasha Hub', 'Decentralised community space in Barcelona.', 'https://akasha.barcelona/'),
          entity('Commons Hub Brussels', 'Sister hub in Brussels.', 'https://commonshub.brussels/'),
          entity('Liminal Village', 'Open-source eco-tech co-living hub in Italy.', 'https://liminalvillage.com/'),
          entity('Traditional Dream Factory', 'Regenerative village in Alentejo, Portugal.', 'https://www.traditionaldreamfactory.com/'),
          entity('Digital Arts / Angewandte', 'Digital Arts at the University of Applied Arts Vienna.', 'https://www.dieangewandte.at/en/institutes/fine_arts_and_media_art/digital_arts'),
        ],
      },
      {
        key: 'cta', placement: 'Community page — closing line and link.',
        text: 'Want to base your association at the Hub or partner with us?',
        button_label: 'Get in touch →',
        button_link: '/about#contact',
      },
    ],
  },
  {
    slug: 'gallery',
    title: 'Gallery',
    fixed_route: '/gallery',
    seo: {
      seo_title_tag: 'Gallery',
      seo_description: 'Photos from the Commons Hub — the house, the common spaces, the people, and life in the Austrian Alps.',
    },
    sections: [
      {
        key: 'intro',
        placement: 'Gallery page — heading and intro. The photo sections are every carousel whose name starts with "gallery:" (Building blocks → Carousels).',
        heading: 'Gallery',
        text: 'A look around the Commons Hub — the house, the common spaces, and life in the valley. Click any photo to enlarge.',
      },
    ],
  },
  {
    slug: 'surroundings',
    title: 'Nature & Surroundings',
    fixed_route: '/surroundings',
    seo: {
      seo_title_tag: 'Nature & Surroundings',
      seo_description: 'The mountains, village and activities around the Commons Hub in Reichenau an der Rax — a teaser into the community wiki.',
    },
    sections: [
      {
        key: 'intro', placement: 'Nature & Surroundings page — heading and intro.',
        heading: 'Nature & Surroundings',
        text: 'The Commons Hub sits in the Rax valley, an hour and a half south of Vienna. Here\'s a taste of what\'s around — dive deeper in the community wiki.',
      },
      {
        key: 'teasers',
        placement: 'Nature & Surroundings page — the three teaser columns. The button text applies to all three; each links to its own address.',
        button_label: 'Explore on the wiki →',
        items: [
          {
            anchor: 'nature', title: 'Nature', link: `${WIKI_BASE}/nature`, hint: 'Rax mountains / forest trail, wide landscape',
            text: 'The Rax massif rises straight from the valley — alpine trails, forests, swimming spots and via ferrata, all within reach of the front door.',
          },
          {
            anchor: 'surroundings', title: 'Surroundings', link: `${WIKI_BASE}/surroundings`, hint: 'Village / villa or Hirschwang street scene',
            text: 'Reichenau an der Rax kept the villas of its 19th-century summer nobility; neighbouring Hirschwang stayed industrial. Cafés, trains and day trips are all close by.',
          },
          {
            anchor: 'activities', title: 'Activities', link: `${WIKI_BASE}/activities`, hint: 'People on an activity — hike, climb or sauna',
            text: 'Hiking, climbing, cycling and winter sports in the valley — plus the workshops, gatherings and saunas happening at the Hub itself.',
          },
        ],
      },
    ],
  },
  {
    slug: 'event-toolbox',
    title: 'Event Organizer Toolbox',
    fixed_route: '/event-toolbox',
    seo: {
      seo_title_tag: 'Event Organizer Toolbox',
      seo_description: 'Free templates and tools for organizing events at the commons hub — coming soon.',
    },
    sections: [
      { key: 'intro', placement: 'Event Toolbox page — heading and intro line.', heading: 'Event Organizer Toolbox', text: 'Nothing to see yet, but expect this stuff soon:' },
      {
        key: 'items', placement: 'Event Toolbox page — the bullet list (bold title — text).',
        items: [
          { title: 'Templates', text: 'calculation sheet, roadmap & timeline, communication templates' },
          { title: 'Trusted Service Providers', text: 'design, recording, photography, etc.' },
          { title: 'Community Engagement Strategies & Tools', text: 'Forum / Wiki' },
          { title: 'Facilitation Tools', text: 'Open Space Technology // Liberating Structures // Event Teams // Awareness Protocol' },
        ],
      },
      { key: 'outro', placement: 'Event Toolbox page — closing note.', text: 'We\'ll likely summarize all of this into a blog post linking out to the individual items.' },
    ],
  },
  {
    slug: 'linktree',
    title: 'Linktree',
    fixed_route: '/linktree',
    sections: [
      {
        key: 'profile', placement: 'Linktree page — line under the logo. (Social icons: Settings → Site settings.)',
        text: 'A versatile event space offering lodging, event organization, and community building.',
      },
      {
        key: 'links', placement: 'Linktree page — the buttons. "Is download" makes the browser download the file instead of opening it.',
        items: [
          { title: 'Group Bookings', link: 'https://www.gruppenhaus.de/seminarhaus-hirschwangerhof-commons-hub-reichenau-an-der-rax-hs12746.html', icon: 'group' },
          { title: 'Website', link: '/', icon: 'globe' },
          { title: 'Newsletter', link: '/#newsletter', icon: 'mail' },
          { title: 'Brochure EN', link: '/brochures/commons_hub_brochure_EN.pdf', icon: 'document', is_download: true },
          { title: 'Brochure DE', link: '/brochures/commons_hub_brochure_DE.pdf', icon: 'document', is_download: true },
          { title: 'Commons Hub Pitch Deck', link: '/pitchdecks/Commons Hub Deck.pdf', icon: 'document', is_download: true },
          { title: 'Church of the Commons Pitch Deck', link: '/pitchdecks/Church of the Commons Deck.pdf', icon: 'document', is_download: true },
        ],
      },
      { key: 'footer', placement: 'Linktree page — line at the bottom, after "© <year>".', text: 'Commons Hub. All rights reserved.' },
    ],
  },
  {
    slug: 'site-footer',
    title: 'Footer (every page)',
    fixed_route: '(footer — shown on every page)',
    sections: [
      {
        key: 'brand', placement: 'Footer — first column: name and tagline (email: Settings → Site settings).',
        heading: 'Commons Hub',
        text: 'A communal guesthouse & events venue in the Austrian Alps.',
        i18n: { text: 'footer.tagline' },
      },
      {
        key: 'col_visit', placement: 'Footer — link column 1.', heading: 'Visit', i18n: { heading: 'footer.visit' },
        items: [
          { title: 'Accommodation', link: '/accommodation', i18n: { title: 'links.accommodation' } },
          { title: 'Event Venue', link: '/event-venue', i18n: { title: 'links.eventVenue' } },
          { title: 'Event Toolbox', link: '/event-toolbox', i18n: { title: 'links.eventToolbox' } },
        ],
      },
      {
        key: 'col_discover', placement: 'Footer — link column 2.', heading: 'Discover', i18n: { heading: 'footer.discover' },
        items: [
          { title: 'Events', link: '/events', i18n: { title: 'links.events' } },
          { title: 'Blog', link: '/blog', i18n: { title: 'links.blog' } },
          { title: 'Gallery', link: '/gallery', i18n: { title: 'links.gallery' } },
          { title: 'About', link: '/about', i18n: { title: 'links.about' } },
        ],
      },
      {
        key: 'col_community', placement: 'Footer — link column 3.', heading: 'Community', i18n: { heading: 'footer.community' },
        items: [
          { title: 'Community & Partners', link: '/community', i18n: { title: 'links.communityPartners' } },
          { title: 'Nature & Surroundings', link: '/surroundings', i18n: { title: 'links.natureSurroundings' } },
          { title: 'Impressum', link: '/page/impressum', i18n: { title: 'links.impressum' } },
        ],
      },
      {
        key: 'bottom', placement: 'Footer — bottom line, after "© <year> Commons Hub ·".',
        text: 'Reichenau an der Rax, Austria', i18n: { text: 'footer.location' },
      },
    ],
  },
];

/** Message-catalog keys now owned by page sections above (not duplicated into ui_strings). */
export const KEYS_MOVED_TO_SECTIONS = new Set([
  'home.bookStay', 'home.planRetreat', 'home.upcomingEvents', 'home.readMore', 'home.latestFromBlog',
  'footer.visit', 'footer.discover', 'footer.community', 'footer.tagline', 'footer.location',
  'links.accommodation', 'links.eventVenue', 'links.eventToolbox', 'links.events', 'links.blog', 'links.gallery',
  'links.about', 'links.communityPartners', 'links.natureSurroundings', 'links.impressum',
]);

/**
 * Editor notes for ui_strings, by key or by group (the part before the first
 * dot). The texts themselves come from messages/en.json (+ its translations in
 * messages/<locale>.json). Strings that used to be hardcoded in components were
 * added to en.json only, so they start untranslated and every language keeps
 * showing what it showed before.
 */
export const UI_STRING_NOTES = {
  common: 'General buttons and labels.',
  home: 'Home page.',
  'home.scrollHint': 'Hint in the corner of every scrolling slideshow.',
  'home.galleryAria': 'Home page — screen-reader label of the gallery preview.',
  gallery: 'Gallery page.',
  events: 'Events page and event cards.',
  eventGrid: 'Event grids on CMS pages with "Is eventpage".',
  map: 'Pages with "Is map".',
  team: 'Pages with "Is team".',
  posts: 'Post grids on CMS pages.',
  progress: 'Posts with a progress bar.',
  instagram: 'Instagram section of the Blog page. {handle} is replaced by the account name.',
  placeholder: 'Boxes shown where a photo is still missing.',
  booking: 'Booking forms (Accommodation and Event Venue). Words in {curly braces} are filled in automatically — keep them.',
  newsletter: 'Newsletter sign-up.',
  language: 'Language switcher.',
};

/**
 * Catalog keys whose translations exist in messages/<locale>.json but were
 * never shown: the booking forms hardcoded these labels in English. They are
 * migrated English-only so every language keeps looking exactly as before;
 * pass --with-booking-translations to the migration to switch the existing
 * machine translations on.
 */
export const UNWIRED_TRANSLATIONS = new Set([
  'booking.numberOfGuests', 'booking.roomType', 'booking.checkIn', 'booking.checkOut', 'booking.yourName',
  'booking.email', 'booking.notes', 'booking.choosePackage', 'booking.startDate', 'booking.endDate',
  'booking.estimatedTotal', 'booking.submit',
]);

/** Booking form options, verbatim from components/bookings/BookingForm.tsx. */
export const BOOKING_OPTIONS = [
  { kind: 'room', option_key: 'single', label: 'Single Room', price_excl_vat: 85, city_tax_per_night: 4.7 },
  { kind: 'room', option_key: 'double_twin', label: 'Double Room (twin beds)', price_excl_vat: 45.5, city_tax_per_night: 4.7 },
  { kind: 'room', option_key: 'double_king', label: 'Double Room (kingsize bed)', price_excl_vat: 45.5, city_tax_per_night: 4.7 },
  { kind: 'room', option_key: 'shared', label: 'Shared (4–6 beds)', price_excl_vat: 35.2, city_tax_per_night: 4.7 },
  { kind: 'event_package', option_key: 'small', label: 'Small', includes: 'Seminar Room + Common Areas', capacity: 'max. 20 guests', price_excl_vat: 200 },
  { kind: 'event_package', option_key: 'medium', label: 'Mid', includes: 'Seminar Room, Conference Hall + Common Areas', capacity: 'max. 30 guests', price_excl_vat: 500 },
  { kind: 'event_package', option_key: 'large', label: 'Big', includes: 'Seminar Room, Conference Hall, Maker Hall + Common Areas', capacity: 'max. 65 guests', price_excl_vat: 700 },
  { kind: 'event_package', option_key: 'xlarge', label: 'Extra Big', includes: 'Everything above', capacity: 'max. 100 guests', price_excl_vat: 1000 },
  { kind: 'event_package', option_key: 'call', label: "I don't know yet", includes: "Tell us your plan and we'll find the right fit", capacity: '', price_excl_vat: 0 },
];
