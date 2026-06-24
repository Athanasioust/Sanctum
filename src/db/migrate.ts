/**
 * Standalone migration runner (used by `npm run db:migrate`).
 * Runs outside the Next.js runtime, so it builds its own connection rather
 * than importing the server-only db module.
 */
import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { DATA_DIR, DB_PATH, MIGRATIONS_DIR } from "../lib/paths";

fs.mkdirSync(DATA_DIR, { recursive: true });
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);
console.log("Running migrations from", MIGRATIONS_DIR);
migrate(db, { migrationsFolder: MIGRATIONS_DIR });
console.log("Migrations complete.");
sqlite.close();
