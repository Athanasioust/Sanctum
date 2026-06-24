import { and, asc, desc, eq, type SQL } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import type { ZodType } from "zod";
import { db } from "@/db";
import {
  ApiError,
  apiRoute,
  json,
  parseBody,
  readJson,
  requireId,
} from "@/lib/api";

type CrudConfig = {
  table: SQLiteTable;
  idColumn: SQLiteColumn;
  createSchema: ZodType;
  updateSchema: ZodType;
  /** When set, the collection GET filters by ?campaignId=. */
  campaignColumn?: SQLiteColumn;
  /** Default ordering for the collection GET. */
  orderBy?: { column: SQLiteColumn; dir?: "asc" | "desc" };
  /** Extra string filter columns supported as query params, e.g. { type: npcs.type }. */
  filterColumns?: Record<string, SQLiteColumn>;
  /** Numeric filter columns supported as query params, e.g. { ownerId: spells.ownerId }. */
  numericFilterColumns?: Record<string, SQLiteColumn>;
};

/** Build GET (list) and POST (create) handlers for a collection route. */
export function collectionHandlers(cfg: CrudConfig) {
  const GET = apiRoute(async (req) => {
    const url = new URL(req.url);
    const filters: SQL[] = [];

    const campaignId = url.searchParams.get("campaignId");
    if (cfg.campaignColumn && campaignId) {
      filters.push(eq(cfg.campaignColumn, Number(campaignId)));
    }
    if (cfg.filterColumns) {
      for (const [param, column] of Object.entries(cfg.filterColumns)) {
        const value = url.searchParams.get(param);
        if (value !== null && value !== "") {
          filters.push(eq(column, value));
        }
      }
    }
    if (cfg.numericFilterColumns) {
      for (const [param, column] of Object.entries(cfg.numericFilterColumns)) {
        const value = url.searchParams.get(param);
        if (value !== null && value !== "" && !Number.isNaN(Number(value))) {
          filters.push(eq(column, Number(value)));
        }
      }
    }

    let q = db.select().from(cfg.table).$dynamic();
    if (filters.length) q = q.where(and(...filters));
    if (cfg.orderBy) {
      q = q.orderBy(
        cfg.orderBy.dir === "asc"
          ? asc(cfg.orderBy.column)
          : desc(cfg.orderBy.column),
      );
    }
    return json(await q);
  });

  const POST = apiRoute(async (req) => {
    const data = parseBody(cfg.createSchema, await readJson(req));
    const [row] = await db
      .insert(cfg.table)
      .values(data as never)
      .returning();
    return json(row, 201);
  });

  return { GET, POST };
}

/** Build GET/PATCH/DELETE handlers for a single-item route. */
export function itemHandlers(cfg: CrudConfig) {
  const GET = apiRoute<{ id: string }>(async (_req, { params }) => {
    const id = requireId((await params).id);
    const [row] = await db.select().from(cfg.table).where(eq(cfg.idColumn, id));
    if (!row) throw new ApiError("Not found", 404);
    return json(row);
  });

  const PATCH = apiRoute<{ id: string }>(async (req, { params }) => {
    const id = requireId((await params).id);
    const raw = await readJson(req);
    const data = parseBody(cfg.updateSchema, raw) as Record<string, unknown>;
    // PATCH must be a true partial update: only persist keys the client
    // actually sent. Zod `.partial()` still fills `.default()` values for
    // absent keys, which would silently wipe untouched columns (e.g. pinning
    // a note must not clear its title/content).
    const present = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const patch = Object.fromEntries(
      Object.entries(data).filter(([key]) => key in present),
    );
    if (Object.keys(patch).length === 0) {
      const [row] = await db.select().from(cfg.table).where(eq(cfg.idColumn, id));
      if (!row) throw new ApiError("Not found", 404);
      return json(row);
    }
    const [row] = await db
      .update(cfg.table)
      .set(patch as never)
      .where(eq(cfg.idColumn, id))
      .returning();
    if (!row) throw new ApiError("Not found", 404);
    return json(row);
  });

  const DELETE = apiRoute<{ id: string }>(async (_req, { params }) => {
    const id = requireId((await params).id);
    const [row] = await db
      .delete(cfg.table)
      .where(eq(cfg.idColumn, id))
      .returning();
    if (!row) throw new ApiError("Not found", 404);
    return json({ success: true });
  });

  return { GET, PATCH, DELETE };
}
