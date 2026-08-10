import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { UPLOADS_DIR } from "@/lib/paths";
import { ApiError, apiRoute, json } from "@/lib/api";

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_AUDIO_BYTES = 100 * 1024 * 1024;

// Allowlist of safe raster image types only. SVG is intentionally excluded —
// it can carry embedded scripts (stored-XSS risk when rendered inline).
const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

const AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "weba",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
  "audio/mp4": "m4a",
  "audio/aac": "m4a",
};

const DOCUMENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
};

/**
 * Uploads are constrained per kind rather than by one shared allowlist, so
 * adding audio and PDFs doesn't quietly let someone drop an MP3 into a field
 * that expects a map image.
 */
const KINDS: Record<string, { types: Record<string, string>; max: number; label: string }> = {
  image: { types: IMAGE_TYPES, max: MAX_BYTES, label: "PNG, JPEG, GIF or WebP images" },
  audio: { types: AUDIO_TYPES, max: MAX_AUDIO_BYTES, label: "MP3, OGG, WAV, FLAC or M4A audio" },
  document: { types: DOCUMENT_TYPES, max: MAX_BYTES, label: "PDF documents" },
};

export const POST = apiRoute(async (req) => {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new ApiError("No file provided", 400);
  }

  const requested = String(formData.get("kind") ?? "image");
  const kind = KINDS[requested];
  if (!kind) throw new ApiError("Unknown upload kind", 400);

  const ext = kind.types[file.type];
  if (!ext) {
    throw new ApiError(`Only ${kind.label} are allowed`, 415);
  }
  if (file.size > kind.max) {
    throw new ApiError(
      `File is too large (max ${Math.round(kind.max / 1024 / 1024)}MB)`,
      413,
    );
  }

  // Filename is a server-generated UUID with an allowlisted extension, so no
  // user-supplied text ever reaches the filesystem path.
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);

  return json({ url: `/uploads/${filename}` }, 201);
});
