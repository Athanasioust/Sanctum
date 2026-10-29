import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/lib/paths";

const SAFE_NAME = /^[A-Za-z0-9._-]+$/;

/** Fogged player renders are named so they can be told apart from DM uploads. */
export const PLAYER_IMAGE_PREFIX = "atlas-player-";

/** The file behind an `/uploads/<name>` URL, or null for anything else. */
export function uploadFilePath(url: string | null | undefined): string | null {
  const m = /^\/uploads\/([^/?#]+)$/.exec(url ?? "");
  if (!m || !SAFE_NAME.test(m[1]) || m[1].includes("..")) return null;
  return path.join(UPLOADS_DIR, m[1]);
}

/**
 * Delete a fogged player render. Only ever touches files this feature wrote,
 * never an image the DM uploaded.
 */
export async function removePlayerImage(url: string | null | undefined) {
  const file = uploadFilePath(url);
  if (!file || !path.basename(file).startsWith(PLAYER_IMAGE_PREFIX)) return;
  await fs.rm(file, { force: true }).catch(() => {});
}

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

/** An uploaded image as a data: URI, for the standalone export. */
export async function uploadAsDataUri(url: string | null | undefined): Promise<string | null> {
  const file = uploadFilePath(url);
  if (!file) return null;
  const mime = MIME[path.extname(file).slice(1).toLowerCase()];
  if (!mime) return null;
  try {
    const buf = await fs.readFile(file);
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
