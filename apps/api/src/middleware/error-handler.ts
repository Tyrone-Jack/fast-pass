import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

/**
 * HttpError — the shape our own code throws when it wants a specific
 * status code. Everything else is treated as a 500.
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * 404 handler. Registered after all routes — catches anything
 * that didn't match a route.
 */
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "NOT_FOUND" });
}

/**
 * Central error handler. Express 5 forwards rejected async handlers
 * here automatically — no need for try/catch in every route.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      details: err.flatten().fieldErrors,
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.code ?? "HTTP_ERROR",
      message: err.message,
    });
  }

  // Unknown error: log it, return 500 without leaking details.
  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
}
