import "server-only";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { BACKUPS_DIR, DATA_DIR, DB_PATH, MIGRATIONS_DIR } from "@/lib/paths";
import * as schema from "./schema";

/**
 * Create a dated snapshot of the database on startup if none exists for today.
 * Runs synchronously right after the connection opens (before any writes), so a
 * plain file copy of the checkpointed database is safe.
 */
function ensureDailyBackup(
  db: BetterSQLite3Database<typeof schema>,
  sqlite: Database.Database,
) {
  try {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const existsForToday = fs
      .readdirSync(BACKUPS_DIR)
      .some((f) => f.startsWith(`sanctum-${today}`));
    if (existsForToday) return;

    sqlite.pragma("wal_checkpoint(TRUNCATE)");
    const stamp = `${today}-${new Date().toTimeString().slice(0, 8).replace(/:/g, "")}`;
    const filename = `sanctum-${stamp}.db`;
    fs.copyFileSync(DB_PATH, path.join(BACKUPS_DIR, filename));
    db.insert(schema.backups)
      .values({ filePath: filename, label: "Auto-backup (startup)" })
      .run();
  } catch (err) {
    console.error("[db] auto-backup failed:", err);
  }
}

function createDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  let sqlite: Database.Database;
  try {
    sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    // Enforce foreign-key constraints (off by default in SQLite).
    sqlite.pragma("foreign_keys = ON");
    // Touch the header so a corrupted/non-database file fails fast and clearly.
    sqlite.pragma("user_version");
  } catch (err) {
    console.error(
      `[db] Could not open the database at ${DB_PATH}. The file may be corrupted or ` +
        `inaccessible. Restore a snapshot from the "backups" folder, or move/delete the ` +
        `file to start a fresh database.`,
      err,
    );
    throw err;
  }

  const db = drizzle(sqlite, { schema });

  // Auto-apply migrations on first connection so the local-first app is always
  // ready without a manual migrate step.
  if (fs.existsSync(MIGRATIONS_DIR)) {
    try {
      migrate(db, { migrationsFolder: MIGRATIONS_DIR });
      ensureDailyBackup(db, sqlite);
    } catch (err) {
      console.error("[db] auto-migration failed:", err);
    }
  }

  return { db, sqlite };
}

// Reuse a single connection across hot reloads in development.
const globalForDb = globalThis as unknown as {
  __sanctumDb?: ReturnType<typeof createDb>;
};

const instance = globalForDb.__sanctumDb ?? createDb();
if (process.env.NODE_ENV !== "production") {
  globalForDb.__sanctumDb = instance;
}

export const db = instance.db;
export const sqlite = instance.sqlite;
export { schema };
