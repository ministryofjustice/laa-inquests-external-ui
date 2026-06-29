import type { NextFunction, Request, Response } from "express";
import { devError } from "#src/infrastructure/express/middleware/logger.js";
import { UpstreamHttpError } from "#src/use-cases/common/upstreamHttpError.js";

const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_SERVER_ERROR = 500;

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

function getHttpStatusCode(error: unknown): number | null {
  if (error instanceof HttpError || error instanceof UpstreamHttpError) {
    return error.statusCode;
  }

  return null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message !== "") {
    return error.message;
  } else {
    return "An unexpected error occurred. Please try again.";
  }
}

function renderErrorPage(
  res: Response,
  statusCode: number,
  message: string,
): void {
  res.status(statusCode);
  res.render("main/error", {
    status: statusCode,
    error: message,
  });
}

export function handleNotFound(req: Request, res: Response): void {
  devError(`404 Not Found: ${req.method} ${req.originalUrl}`);
  renderErrorPage(
    res,
    HTTP_NOT_FOUND,
    "The page you are looking for could not be found.",
  );
}

export function handleBadRequest(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const statusCode = getHttpStatusCode(error);
  if (statusCode === HTTP_BAD_REQUEST) {
    devError(`400 Bad Request: ${req.method} ${req.originalUrl}`);
    renderErrorPage(res, HTTP_BAD_REQUEST, getErrorMessage(error));
  } else {
    next(error);
  }
}

export function handleApplicationError(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const statusCode = getHttpStatusCode(error);
  if (statusCode === null) {
    next(error);
    return;
  }

  if (statusCode === HTTP_NOT_FOUND) {
    handleNotFound(req, res);
  } else if (statusCode === HTTP_BAD_REQUEST) {
    handleBadRequest(error, req, res, next);
  } else {
    devError(`HTTP ${statusCode}: ${req.method} ${req.originalUrl}`);
    renderErrorPage(res, statusCode, getErrorMessage(error));
  }
}

export function handleServerError(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = getErrorMessage(error);
  devError(`500 Internal Server Error: ${req.method} ${req.originalUrl}`);
  renderErrorPage(res, HTTP_INTERNAL_SERVER_ERROR, message);
}
