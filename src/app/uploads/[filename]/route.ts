import fs from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/lib/paths";

export const dynamic = "force-dynamic";

// Uploaded images are stored outside `public/` (see src/lib/paths.ts) so they
// survive in a writable location when the app is packaged. This handler serves
// them back at the same /uploads/<filename> URLs the upload route returns.

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
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
