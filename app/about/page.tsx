import { getTeam } from "@/lib/actions/getTeam";
import { AboutGuide, type TeamMember } from "@/components/about/AboutGuide";

const ASSET_BASE = (
  process.env.NEXT_PUBLIC_DIRECTUS_URL || "https://admin.commons-hub.at"
).replace(/\/$/, "");

export const metadata = {
  title: "About | Commons Hub",
  description:
    "The team, community, history and contact details behind the Commons Hub.",
};

interface TeamRow {
  name: string | null;
  role: string | null;
  bio: string | null;
  profile_image: string | null;
  status: string | null;
}

export default async function AboutPage() {
  const rows = (await getTeam()) as TeamRow[];
  const team: TeamMember[] = rows
    .filter((m) => (m.status ?? "published") === "published" && m.name)
    .map((m) => ({
      name: m.name ?? "",
      role: m.role,
      bio: m.bio,
      imageUrl: m.profile_image
        ? `${ASSET_BASE}/assets/${m.profile_image}`
        : null,
    }));

  return <AboutGuide team={team} />;
}
