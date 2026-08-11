import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * The Bestiary is a tab of the NPCs page now. This route stays so existing
 * bookmarks, deep links and the "back to Bestiary" links on template pages keep
 * working; `/bestiary/new` and `/bestiary/[npcId]` are unaffected.
 */
export default async function BestiaryRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/campaign/${id}/npcs?tab=bestiary`);
}
