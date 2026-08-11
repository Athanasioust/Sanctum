import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Relations is a tab of the NPCs page now; the old route still resolves. */
export default async function RelationsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/campaign/${id}/npcs?tab=relations`);
}
