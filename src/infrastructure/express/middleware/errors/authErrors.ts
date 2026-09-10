import type { NextFunction, Request, Response } from "express";
import { logger } from "#src/infrastructure/express/middleware/logger/logger.js";
import {
  isApplicationError,
  APPLICATION_ERROR_TYPES,
} from "#src/use-cases/common/ApplicationError.js";
import { HTTP_FORBIDDEN } from "#src/infrastructure/locales/constants.js";

const AUTH_PATH_PREFIX = "/auth/";

const handleAuthErrors = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!isApplicationError(err)) {
    next(err);
  } else if (err.type === APPLICATION_ERROR_TYPES.AUTHENTICATION_REQUIRED) {
    // Safety net: never bounce an auth-route failure back into the login
    // redirect, which would risk a redirect loop.
    if (req.path.startsWith(AUTH_PATH_PREFIX)) {
      next(err);
    } else {
      logger.logWarn({
        functionName: "auth_error_middleware",
        message: "Upstream authentication required; destroying session",
        request: req,
        extraContext: {
          event: "auth_session_expired",
          operation: err.operation,
        },
      });

      req.session.destroy(() => {
        res.redirect("/auth/login");
      });
    }
  } else if (err.type === APPLICATION_ERROR_TYPES.FORBIDDEN) {
    logger.logWarn({
      functionName: "auth_error_middleware",
      message: "Upstream returned forbidden",
      request: req,
      extraContext: {
        event: "api_forbidden",
        operation: err.operation,
      },
    });

    res.status(HTTP_FORBIDDEN).render("main/error", {
      status: HTTP_FORBIDDEN,
      message: "Forbidden",
    });
  } else {
    next(err);
  }
};

export { handleAuthErrors };
