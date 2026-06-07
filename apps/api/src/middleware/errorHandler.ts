import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "VALIDATION", details: err.flatten() });
  }
  const message = err instanceof Error ? err.message : "INTERNAL_ERROR";
  const map: Record<string, number> = {
    NOT_FOUND: 404,
    FORBIDDEN: 403,
    UNAUTHORIZED: 401,
    INVALID_CREDENTIALS: 401,
    INVALID_STATE: 409,
    INVALID_QUANTITY: 400,
    TAKE_LIMIT_EXCEEDED: 429,
    INVALID_FILE: 400,
  };
  const status = map[message] ?? 500;
  if (status === 500 && message !== "INTERNAL_ERROR") {
    console.error(err);
  }
  res.status(status).json({ error: message });
}
