import type { NextFunction, Request, Response } from "express";
import {
  findRoutePolicy,
  hasAllowedRole,
  isPublicPath,
} from "#src/infrastructure/config/accessControl.js";
import { HTTP_FORBIDDEN } from "#src/infrastructure/locales/constants.js";
import { logger } from "#src/infrastructure/logging/logger.js";
import { t } from "#src/infrastructure/express/middleware/nunjucks/i18nLoader.js";

type DenyReason = "unconfigured_route" | "insufficient_role";

/**
 * Central, default-deny page-level authorisation.
 *
 * Decision order:
 * 1. Allow explicitly public / infrastructure paths.
 * 2. Defer unauthenticated requests so `requireAuth` owns the login redirect.
 * 3. Deny authenticated requests to routes missing from the central policy.
 * 4. Allow when any session role satisfies the policy; otherwise deny.
 *
 * Denied requests render the shared error page with a 403 and emit a single
 * structured warning carrying only non-sensitive metadata.
 */

export const globalAccessGuard = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { path } = req;

  if (isPublicPath(path)) {
    next();
    return;
  }

  if (req.session.userId === undefined) {
    next();
    return;
  }

  const policy = findRoutePolicy(path);
  if (policy === undefined) {
    denyAccess(req, res, "unconfigured_route");
    return;
  }

  const roles = req.session.roles ?? [];
  if (hasAllowedRole(roles, policy)) {
    next();
    return;
  }

  denyAccess(req, res, "insufficient_role");
};

function denyAccess(req: Request, res: Response, reason: DenyReason): void {
  logger.logWarn({
    functionName: "global_access_guard",
    message: "Access denied",
    request: req,
    extraContext: {
      event: "access_denied",
      reason,
      route: req.path,
      method: req.method,
      status_code: HTTP_FORBIDDEN,
    },
  });

  res.status(HTTP_FORBIDDEN).render("main/error", {
    status: HTTP_FORBIDDEN,
    error: t("pages.error.accessDenied"),
  });
}
