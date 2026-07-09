import type { NextFunction, Request, Response } from "express";
import { HTTP_INTERNAL_SERVER_ERROR } from "#src/infrastructure/express/middleware/errors.js";
import { devError } from "#src/infrastructure/express/middleware/logger.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = err instanceof Error ? err.message : String(err);
  devError(message);
  res.status(HTTP_INTERNAL_SERVER_ERROR).render("main/internal-server-error");
}
