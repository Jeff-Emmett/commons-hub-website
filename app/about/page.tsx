import { getTeam } from "@/lib/actions/getTeam";
import { AboutGuide, type TeamMember } from "@/components/about/AboutGuide";
import { assetUrl, getPageContent, getSiteSettings, pageMetadata, sectionEdit } from "@/lib/cms/content";

// Content: Directus → Pages → "ABOUT" → Sections (team, history, contact);
// people: Building blocks → Team; address/email: Settings → Site settings.
export function generateMetadata() {
  return pageMetadata("about", {
    title: "About",
    description: "The team, community, history and contact details behind the Commons Hub.",
  });
}

interface TeamRow {
  name: string | null;
  role: string | null;
  bio: string | null;
  profile_image: string | null;
  status: string | null;
}

export default async function AboutPage() {
  const [rows, page, site] = await Promise.all([
    getTeam() as Promise<TeamRow[]>,
    getPageContent("about"),
    getSiteSettings(),
  ]);
  const team: TeamMember[] = rows
    .filter((m) => (m.status ?? "published") === "published" && m.name)
    .map((m) => ({
      name: m.name ?? "",
      role: m.role,
      bio: m.bio,
      imageUrl: assetUrl(m.profile_image),
    }));
  const s = page?.sections ?? {};

  return (
    <AboutGuide
      team={team}
      sections={{
        team: s.team && { heading: s.team.heading, nav: s.team.nav_label, editAttr: sectionEdit(s.team) },
        history: s.history && {
          heading: s.history.heading,
          nav: s.history.nav_label,
          editAttr: sectionEdit(s.history),
          items: s.history.items.map((i) => ({ title: i.title, text: i.text })),
        },
        contact: s.contact && { heading: s.contact.heading, nav: s.contact.nav_label, editAttr: sectionEdit(s.contact) },
      }}
      siteName={site.site_name}
      address={site.address}
      email={site.contact_email}
    />
  );
}
