import { apiRoute, json, readJson } from "@/lib/api";
import { createBackup, listBackups } from "@/lib/backup";

export const GET = apiRoute(async () => {
  return json(await listBackups());
});

export const POST = apiRoute(async (req) => {
  const body = (await readJson(req)) as { label?: string };
  const label = body.label?.trim() || "Manual backup";
  const row = await createBackup(label);
  return json(row, 201);
});
