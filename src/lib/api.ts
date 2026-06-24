import { NextResponse } from "next/server";
import type { ZodType } from "zod";

/** Error type that route handlers can throw to produce a clean HTTP response. */
export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

/** Safely read a JSON request body, returning {} on empty/invalid bodies. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

/** Validate `data` against a zod schema, throwing ApiError(400) on failure. */
export function parseBody<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    throw new ApiError("Validation failed", 422, details);
  }
  return result.data;
}

/** Parse a route param into a positive integer id, throwing ApiError(400). */
export function requireId(value: string | undefined): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ApiError("Invalid id", 400);
  }
  return n;
}

type RouteCtx<P> = { params: Promise<P> };

/**
 * Wrap a route handler with consistent error handling. Handlers may throw
 * ApiError for expected failures; anything else becomes a 500.
 */
export function apiRoute<P = Record<string, string>>(
  fn: (req: Request, ctx: RouteCtx<P>) => Promise<Response> | Response,
) {
  return async (req: Request, ctx: RouteCtx<P>) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResponse(err.message, err.status, err.details);
      }
      console.error("[api] unhandled error:", err);
      return errorResponse("Internal server error", 500);
    }
  };
}
