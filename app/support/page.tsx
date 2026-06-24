import { getTranslations } from "next-intl/server";
import { ArtizenSupport } from "@/components/support/ArtizenSupport";
import { artizenProjectUrl, getCampaignStats } from "@/lib/services/artizen";

export async function generateMetadata() {
  const t = await getTranslations("support");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function SupportPage() {
  const stats = await getCampaignStats();
  return <ArtizenSupport projectUrl={artizenProjectUrl()} stats={stats} />;
}
