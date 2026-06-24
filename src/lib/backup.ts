import "server-only";
import fs from "node:fs";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { db, sqlite } from "@/db";
import { backups } from "@/db/schema";
import { ApiError } from "@/lib/api";
import { BACKUPS_DIR, DB_PATH } from "@/lib/paths";

function timestamp() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  return `${date}-${time}`;
}

/** Create a checkpointed snapshot of the database file. */
export async function createBackup(label = "Manual backup") {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  try {
    sqlite.pragma("wal_checkpoint(TRUNCATE)");
  } catch {
    // ignore checkpoint failures; copy is still usable
  }
  const filename = `sanctum-${timestamp()}.db`;
  fs.copyFileSync(DB_PATH, path.join(BACKUPS_DIR, filename));
  const [row] = await db.insert(backups).values({ filePath: filename, label }).returning();
  return row;
}

export async function listBackups() {
  return db.select().from(backups).orderBy(desc(backups.createdAt));
}

export async function deleteBackup(id: number) {
  const [row] = await db.select().from(backups).where(eq(backups.id, id));
  if (!row) throw new ApiError("Backup not found", 404);
  const file = path.join(BACKUPS_DIR, row.filePath);
  if (fs.existsSync(file)) fs.rmSync(file);
  await db.delete(backups).where(eq(backups.id, id));
}

/**
 * Restore a backup over the live database. A safety copy of the current state
 * is taken first. The running connection keeps the previous data until the app
 * is restarted, at which point the restored file is loaded.
 */
export async function restoreBackup(id: number) {
  const [row] = await db.select().from(backups).where(eq(backups.id, id));
  if (!row) throw new ApiError("Backup not found", 404);
  const source = path.join(BACKUPS_DIR, row.filePath);
  if (!fs.existsSync(source)) throw new ApiError("Backup file is missing", 410);

  // Safety snapshot of the current database before overwriting it.
  try {
    sqlite.pragma("wal_checkpoint(TRUNCATE)");
  } catch {
    /* ignore */
  }
  const safety = `sanctum-pre-restore-${timestamp()}.db`;
  fs.copyFileSync(DB_PATH, path.join(BACKUPS_DIR, safety));

  // Overwrite the main database file and drop stale WAL/SHM sidecars.
  fs.copyFileSync(source, DB_PATH);
  for (const sidecar of [`${DB_PATH}-wal`, `${DB_PATH}-shm`]) {
    if (fs.existsSync(sidecar)) fs.rmSync(sidecar);
  }

  return { safetyBackup: safety };
}
