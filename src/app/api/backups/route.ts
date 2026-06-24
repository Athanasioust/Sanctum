import { apiRoute, json, readJson } from "@/lib/api";
import { createBackup, listBackups } from "@/lib/backup";

export const GET = apiRoute(async () => {
  return json(await listBackups());
});

export const POST = apiRoute(async (req) => {
  const body = (await readJson(req)) as { label?: unknown };
  const label =
    typeof body?.label === "string" && body.label.trim()
      ? body.label.trim().slice(0, 100)
      : "Manual backup";
  const row = await createBackup(label);
  return json(row, 201);
});
