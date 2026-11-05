import type { NextFunction, Request, Response } from "express";
import {
  buildRequestContext,
  runWithRequestContext,
} from "#src/infrastructure/logging/requestContext.js";

// Establishes a request-scoped logging context so that logs emitted deep in the
// async call chain (e.g. outbound adapters) share the same request and
// correlation IDs as the final HTTP boundary log, without passing the Express
// request inward.
export const requestContextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const context = buildRequestContext(req.headers);
  res.setHeader("x-request-id", context.requestId);
  res.setHeader("x-correlation-id", context.correlationId);
  runWithRequestContext(context, next);
};
