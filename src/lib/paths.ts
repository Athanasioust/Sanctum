import path from "node:path";

/** Filesystem locations used by the local-first persistence layer. */
export const DATA_DIR = path.join(process.cwd(), "data");
export const DB_PATH = path.join(DATA_DIR, "sanctum.db");
export const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");
export const BACKUPS_DIR = path.join(process.cwd(), "backups");
export const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
