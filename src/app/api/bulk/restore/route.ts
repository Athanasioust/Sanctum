import { z } from "zod";
import { apiRoute, json, parseBody, readJson } from "@/lib/api";
import { bulkRestore } from "@/lib/bulk";

const schema = z.object({ token: z.string().min(1).max(64) });

/** Undo a bulk delete; returns the restored rows. */
export const POST = apiRoute(async (req) => {
  const { token } = parseBody(schema, await readJson(req));
  return json({ restored: bulkRestore(token) });
});
