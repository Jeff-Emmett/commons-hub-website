"use client";

import { useTranslations } from "next-intl";
import { ARTIZEN_CAMPAIGN, type ArtizenStats } from "@/lib/services/artizen";

interface Props {
  projectUrl: string;
  stats: ArtizenStats | null;
}

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const count = (n: number) => new Intl.NumberFormat("en-US").format(n);

export function ArtizenSupport({ projectUrl, stats }: Props) {
  const t = useTranslations("support");

  const hasStats =
    stats != null &&
    (stats.raisedUsd != null ||
      stats.artifactsSold != null ||
      stats.matchUnlockedUsd != null);

  const goalPercent =
    stats?.raisedUsd != null && stats.goalUsd
      ? Math.min(Math.max((stats.raisedUsd / stats.goalUsd) * 100, 0), 100)
      : null;

  const steps = [
    { title: t("step1Title"), body: t("step1Body") },
    { title: t("step2Title"), body: t("step2Body") },
    { title: t("step3Title"), body: t("step3Body") },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* Hero */}
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600 mb-3">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2 align-middle" />
        {t("kicker", { season: ARTIZEN_CAMPAIGN.season })}
      </p>
      <h1 className="h1 mb-5">{t("heading")}</h1>
      <p className="text-lg text-slate-700 leading-relaxed mb-8">{t("intro")}</p>

      {/* Stats — live when configured, otherwise a static note */}
      <div className="rounded-2xl border border-gray-200 bg-slate-50 p-6 md:p-8 mb-8">
        {hasStats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <Stat
                value={stats!.raisedUsd != null ? usd(stats!.raisedUsd) : "—"}
                label={t("statsRaised")}
              />
              <Stat
                value={
                  stats!.artifactsSold != null
                    ? count(stats!.artifactsSold)
                    : "—"
                }
                label={t("statsArtifacts")}
              />
              <Stat
                value={
                  stats!.matchUnlockedUsd != null
                    ? usd(stats!.matchUnlockedUsd)
                    : "—"
                }
                label={t("statsMatch")}
              />
            </div>
            {goalPercent != null && (
              <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                  style={{ width: `${goalPercent}%` }}
                />
              </div>
            )}
            <p className="mt-4 text-center text-xs text-slate-500">
              {t("statsLiveNote")}
            </p>
          </>
        ) : (
          <p className="text-center text-slate-600">{t("statsFallback")}</p>
        )}
      </div>

      {/* Primary CTA */}
      <div className="text-center mb-12">
        <a
          href={projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-full bg-slate-900 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-slate-700"
        >
          {t("cta")}
        </a>
        <p className="mt-3 text-sm text-slate-500">{t("ctaNote")}</p>
      </div>

      {/* How it works */}
      <h2 className="text-2xl font-semibold mb-8 text-center">
        {t("howHeading")}
      </h2>
      <ol className="space-y-8">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-5">
            <span className="flex-none flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white font-semibold">
              {i + 1}
            </span>
            <div>
              <h3 className="text-lg font-semibold mb-1">{s.title}</h3>
              <p className="text-slate-700 leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}
