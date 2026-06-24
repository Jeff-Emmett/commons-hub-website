// Artizen campaign integration.
//
// The Commons Hub runs a match-funded campaign ("Valley of the Common") on
// Artizen. We deliberately do NOT process payments ourselves: the value of
// Artizen is its match funding + season prize, and that accounting only happens
// inside Artizen's backend. A dollar spent off-platform would NOT count toward
// our match or leaderboard rank. So the actual purchase always hands off to
// Artizen; this module only describes the campaign and (optionally) reads live
// stats to render a native-feeling progress widget.
//
// Artizen's backend is Hasura GraphQL + on-chain Season contracts (originally
// Ethereum mainnet). There is no documented public read endpoint, so live stats
// are OPTIONAL: set ARTIZEN_STATS_URL to a JSON endpoint returning the shape in
// `ArtizenStats` and the widget lights up; leave it unset and the widget shows a
// static "live on Artizen" badge + CTA. See docs/artizen-integration.md for how
// to obtain a confirmed endpoint via a one-time browser network capture.

export const ARTIZEN_CAMPAIGN = {
  /** Project slug as it appears in the Artizen URL. */
  projectSlug: "valley-of-the-common",
  /** Current Artizen season. */
  season: 6,
  /** Price of a single Artifact, in USD. */
  artifactPriceUsd: 10,
} as const;

/** Canonical deep link to the project page on Artizen. */
export function artizenProjectUrl(): string {
  const { projectSlug, season } = ARTIZEN_CAMPAIGN;
  return `https://artizen.fund/index/p/${projectSlug}?season=${season}`;
}

export interface ArtizenStats {
  /** Number of Artifacts sold so far. */
  artifactsSold: number | null;
  /** USD raised directly from Artifact sales. */
  raisedUsd: number | null;
  /** USD of match funding unlocked by those sales. */
  matchUnlockedUsd: number | null;
  /** Optional fundraising goal in USD, for a progress bar. */
  goalUsd: number | null;
  /** ISO timestamp the season ends, for a countdown. */
  seasonEndsAt: string | null;
}

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

const str = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 ? v : null;

/**
 * Fetch live campaign stats from a configured endpoint. Returns null when no
 * endpoint is set or the fetch/parse fails — callers MUST render gracefully
 * without stats (the static badge + CTA is always the floor).
 */
export async function getCampaignStats(): Promise<ArtizenStats | null> {
  const endpoint = process.env.ARTIZEN_STATS_URL;
  if (!endpoint) return null;

  try {
    const res = await fetch(endpoint, {
      // Stats change slowly relative to page views; revalidate every 5 min.
      next: { revalidate: 300 },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const raw: unknown = await res.json();
    if (!raw || typeof raw !== "object") return null;
    const d = raw as Record<string, unknown>;
    return {
      artifactsSold: num(d.artifactsSold),
      raisedUsd: num(d.raisedUsd),
      matchUnlockedUsd: num(d.matchUnlockedUsd),
      goalUsd: num(d.goalUsd),
      seasonEndsAt: str(d.seasonEndsAt),
    };
  } catch {
    // Network/JSON failure — degrade silently to the static experience.
    return null;
  }
}
