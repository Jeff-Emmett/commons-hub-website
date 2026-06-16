import SiteFooter from "@/components/SiteFooter";
import { PlaceholderImage } from "@/components/PlaceholderImage";

// TODO: confirm the real wiki base URL (e.g. https://wiki.commons-hub.at) and
// the per-section paths. Left as "#" so links are visibly inert placeholders
// rather than pointing somewhere wrong.
const WIKI_BASE = "#";

export const metadata = {
  title: "Nature & Surroundings | Commons Hub",
  description:
    "The mountains, village and activities around the Commons Hub in Reichenau an der Rax — a teaser into the community wiki.",
};

interface Teaser {
  id: string;
  title: string;
  blurb: string;
  href: string;
  /** What the eventual photo should show. */
  photo: string;
}

const TEASERS: Teaser[] = [
  {
    id: "nature",
    title: "Nature",
    blurb:
      "The Rax massif rises straight from the valley — alpine trails, forests, swimming spots and via ferrata, all within reach of the front door.",
    href: `${WIKI_BASE}/nature`,
    photo: "Rax mountains / forest trail, wide landscape",
  },
  {
    id: "surroundings",
    title: "Surroundings",
    blurb:
      "Reichenau an der Rax kept the villas of its 19th-century summer nobility; neighbouring Hirschwang stayed industrial. Cafés, trains and day trips are all close by.",
    href: `${WIKI_BASE}/surroundings`,
    photo: "Village / villa or Hirschwang street scene",
  },
  {
    id: "activities",
    title: "Activities",
    blurb:
      "Hiking, climbing, cycling and winter sports in the valley — plus the workshops, gatherings and saunas happening at the Hub itself.",
    href: `${WIKI_BASE}/activities`,
    photo: "People on an activity — hike, climb or sauna",
  },
];

export default function SurroundingsPage() {
  return (
    <main className="page-sections">
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="h1 mb-4">Nature &amp; Surroundings</h1>
        <p className="max-w-3xl text-lg text-slate-700">
          The Commons Hub sits in the Rax valley, an hour and a half south of
          Vienna. Here&apos;s a taste of what&apos;s around — dive deeper in the
          community wiki.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
          {TEASERS.map((t) => (
            <article key={t.id} id={t.id} className="scroll-mt-28">
              <PlaceholderImage label={t.photo} />
              <h2 className="h2 mt-5 mb-2">{t.title}</h2>
              <p className="text-slate-700">{t.blurb}</p>
              <a
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block font-medium text-slate-900 hover:underline"
              >
                Explore on the wiki →
              </a>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
