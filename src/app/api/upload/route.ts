import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { UPLOADS_DIR } from "@/lib/paths";
import { ApiError, apiRoute, json } from "@/lib/api";

export const POST = apiRoute(async (req) => {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new ApiError("No file provided", 400);
  }
  if (!file.type.startsWith("image/")) {
    throw new ApiError("Only image files are allowed", 415);
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new ApiError("Image is too large (max 25MB)", 413);
  }

  const ext =
    (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "png";
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);

  return json({ url: `/uploads/${filename}` }, 201);
});
