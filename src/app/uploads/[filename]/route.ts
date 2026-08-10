import fs from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/lib/paths";

export const dynamic = "force-dynamic";

// Uploaded images are stored outside `public/` (see src/lib/paths.ts) so they
// survive in a writable location when the app is packaged. This handler serves
// them back at the same /uploads/<filename> URLs the upload route returns.

// Extensions the upload route can produce. Anything else is refused, which
// doubles as the allowlist for what this handler will read off disk.
// Audio is served as a whole file rather than in ranges — everything is on
// localhost, so the browser buffers it immediately and can still seek.
const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  weba: "audio/webm",
  flac: "audio/flac",
  m4a: "audio/mp4",
  pdf: "application/pdf",
};

// Filenames we generate are `<uuid>.<ext>`. Reject anything else so a crafted
// request can never escape the uploads directory (path traversal) or read
// arbitrary files.
const SAFE_NAME = /^[A-Za-z0-9._-]+$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (!SAFE_NAME.test(filename) || filename.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(UPLOADS_DIR, path.basename(filename));
  try {
    const data = await fs.readFile(filePath);
    return new Response(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
