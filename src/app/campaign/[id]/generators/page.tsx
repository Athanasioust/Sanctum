import { WandSparkles } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { GeneratorsClient } from "@/components/generators/generators-client";
import { getTranslation } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** Offline random generators: NPCs, taverns, settlements, loot, hooks, rumors, names, weather. */
export default async function GeneratorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const campaignId = Number((await params).id);
  const g = (await searchParams).g;
  const { t } = await getTranslation();

  return (
    <PageContainer>
      <PageHeader title={t("nav.generators")} description={t("gen.pageDescription")} icon={WandSparkles} />
      <GeneratorsClient campaignId={campaignId} initialId={typeof g === "string" ? g : null} />
    </PageContainer>
  );
}
