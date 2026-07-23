import path from "node:path";

/**
 * Filesystem locations used by the local-first persistence layer.
 *
 * Writable data (the database, backups, uploaded images) lives under a single
 * root. In normal `next dev`/`next start` this root is the project working
 * directory, so behaviour is unchanged. When Sanctum is packaged as a desktop
 * app the install folder is read-only, so the Electron shell points
 * `SANCTUM_DATA_ROOT` at a per-user writable directory (e.g. %APPDATA%/Sanctum).
 *
 * Migrations ship read-only with the app; the packaged shell overrides
 * `SANCTUM_MIGRATIONS_DIR` to point at the bundled copy in app resources.
 */
const DATA_ROOT = process.env.SANCTUM_DATA_ROOT
  ? path.resolve(process.env.SANCTUM_DATA_ROOT)
  : process.cwd();

export const DATA_DIR = path.join(DATA_ROOT, "data");
export const DB_PATH = path.join(DATA_DIR, "sanctum.db");
export const BACKUPS_DIR = path.join(DATA_ROOT, "backups");

// Uploaded images live under the writable root (not inside `public/`, which is
// read-only when packaged). They are served at /uploads/* by a route handler
// rather than by static file serving — see src/app/uploads/[filename]/route.ts.
export const UPLOADS_DIR = path.join(DATA_ROOT, "uploads");

export const MIGRATIONS_DIR = process.env.SANCTUM_MIGRATIONS_DIR
  ? path.resolve(process.env.SANCTUM_MIGRATIONS_DIR)
  : path.join(process.cwd(), "drizzle");
