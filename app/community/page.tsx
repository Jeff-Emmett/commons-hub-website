import Link from "next/link";
import Image from "next/image";
import SiteFooter from "@/components/SiteFooter";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import {
  COMMUNITY_INTRO,
  LOCAL_ASSOCIATIONS,
  PARTNERS,
  type CommunityEntity,
} from "@/lib/content/community";

const ASSET_BASE = (
  process.env.NEXT_PUBLIC_DIRECTUS_URL || "https://admin.commons-hub.at"
).replace(/\/$/, "");

const logoUrl = (logo: string | null) =>
  logo ? (logo.startsWith("http") ? logo : `${ASSET_BASE}/assets/${logo}`) : null;

export const metadata = {
  title: "Community | Commons Hub",
  description:
    "The associations based at the Commons Hub and the network of partner spaces we work with.",
};

function EntityCard({ entity }: { entity: CommunityEntity }) {
  const url = logoUrl(entity.logo);
  const body = (
    <div className="flex h-full flex-col gap-3">
      <div className="relative h-16 w-16">
        {url ? (
          <Image
            src={url}
            alt={entity.name}
            fill
            sizes="64px"
            className="object-contain"
          />
        ) : (
          <PlaceholderImage label="Logo" aspect="aspect-square" />
        )}
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">
          {entity.name}
          {entity.href && <span className="text-slate-400"> ↗</span>}
        </h3>
        <p className="mt-1 text-sm text-slate-600">{entity.blurb}</p>
      </div>
    </div>
  );

  const cardClass =
    "rounded-lg border border-slate-200 p-5 transition-colors hover:border-slate-400";

  return entity.href ? (
    <a
      href={entity.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`block ${cardClass}`}
    >
      {body}
    </a>
  ) : (
    <div className={cardClass}>{body}</div>
  );
}

export default function CommunityPage() {
  return (
    <main className="page-sections">
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="h1 mb-4">Community</h1>
        <p className="max-w-3xl text-lg text-slate-700">{COMMUNITY_INTRO}</p>

        {/* Local associations hosted at the Hub (spec 4c) */}
        <h2 className="h2 mt-14 mb-6">Associations hosted at the Hub</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {LOCAL_ASSOCIATIONS.map((e) => (
            <EntityCard key={e.name} entity={e} />
          ))}
        </div>

        {/* Partner network (spec 4d). No sponsors section by design (spec 4e). */}
        <h2 className="h2 mt-14 mb-6">Partners</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PARTNERS.map((e) => (
            <EntityCard key={e.name} entity={e} />
          ))}
        </div>

        <div className="mt-14 border-t border-slate-100 pt-8">
          <p className="text-slate-600">
            Want to base your association at the Hub or partner with us?{" "}
            <Link
              href="/about#contact"
              className="font-medium text-slate-900 hover:underline"
            >
              Get in touch →
            </Link>
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
