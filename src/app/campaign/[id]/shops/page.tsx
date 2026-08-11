import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Shops & Loot is a tab of the Magic Items page now. This route stays so
 * bookmarks and the "back to shops" links on individual shop pages keep
 * working; `/shops/[shopId]` is unaffected.
 */
export default async function ShopsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/campaign/${id}/magic-items?tab=shops`);
}
