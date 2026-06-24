import { apiRoute, json, requireId } from "@/lib/api";
import { restoreBackup } from "@/lib/backup";

type Params = { id: string };

export const POST = apiRoute<Params>(async (_req, { params }) => {
  const id = requireId((await params).id);
  const result = await restoreBackup(id);
  return json({ success: true, ...result });
});
