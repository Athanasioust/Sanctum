import { apiRoute, json, requireId } from "@/lib/api";
import { deleteBackup } from "@/lib/backup";

type Params = { id: string };

export const DELETE = apiRoute<Params>(async (_req, { params }) => {
  const id = requireId((await params).id);
  await deleteBackup(id);
  return json({ success: true });
});
