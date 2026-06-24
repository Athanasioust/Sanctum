import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { UPLOADS_DIR } from "@/lib/paths";
import { ApiError, apiRoute, json } from "@/lib/api";

const MAX_BYTES = 25 * 1024 * 1024;

// Allowlist of safe raster image types only. SVG is intentionally excluded —
// it can carry embedded scripts (stored-XSS risk when rendered inline).
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

export const POST = apiRoute(async (req) => {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new ApiError("No file provided", 400);
  }
  const ext = ALLOWED[file.type];
  if (!ext) {
    throw new ApiError("Only PNG, JPEG, GIF or WebP images are allowed", 415);
  }
  if (file.size > MAX_BYTES) {
    throw new ApiError("Image is too large (max 25MB)", 413);
  }

  // Filename is a server-generated UUID with an allowlisted extension, so no
  // user-supplied text ever reaches the filesystem path.
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);

  return json({ url: `/uploads/${filename}` }, 201);
});
