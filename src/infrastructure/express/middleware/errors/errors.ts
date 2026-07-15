import type { NextFunction, Request, Response } from "express";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";
import {
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_NOT_FOUND,
} from "#src/infrastructure/locales/constants.js";

const handleRouteNotFound = (_: Request, res: Response): void => {
  res.status(HTTP_NOT_FOUND).render("main/error", {
    status: HTTP_NOT_FOUND,
    message: "Page not found",
  });
};

const handleServerErrors = (
  err: unknown,
  req: Request,
  res: Response,
  _: NextFunction,
): void => {
  logger.logError("Server Error Middleware", "Internal Server Error", err, req);
  res.render("main/error", {
    status: HTTP_INTERNAL_SERVER_ERROR,
    message: "Internal Server Error",
  });
};

export { handleRouteNotFound, handleServerErrors };
