import { csrfSync } from "csrf-sync";
import type { Application, Request, Response, NextFunction } from "express";
import "#src/infrastructure/express/middleware/security/csrf.types.js";

const hasCSRFToken = (body: unknown): body is { _csrf: unknown } =>
  body !== null &&
  body !== undefined &&
  typeof body === "object" &&
  "_csrf" in body;

const { csrfSynchronisedProtection } = csrfSync({
  // Extracts the CSRF token from the request body, a header, or the query
  // string. The query string is required for the multi-file-upload widget,
  // which uploads via XHR and cannot add fields to the request body.
  getTokenFromRequest: (req: Request): string | undefined => {
    if (hasCSRFToken(req.body) && typeof req.body._csrf === "string") {
      return req.body._csrf;
    }

    const { headers, query } = req;

    if (typeof headers["x-csrf-token"] === "string") {
      return headers["x-csrf-token"];
    }

    if (typeof query._csrf === "string") {
      return query._csrf;
    }

    return undefined;
  },
});

/*
 - Protects against CSRF attacks using `csrfSync`.
 - Exported so routes mounted before `setupCsrf` (e.g. file uploads) can opt in.
*/
export const csrfProtection = csrfSynchronisedProtection;

/*
 - Applies CSRF protection globally.
 - Ensures CSRF tokens are available in views for forms.
*/
export const setupCsrf = (app: Application): void => {
  app.use(csrfProtection);

  // Middleware to make CSRF token available in views
  app.use((req: Request, res: Response, next: NextFunction): void => {
    if (typeof req.csrfToken === "function") {
      res.locals.csrfToken = req.csrfToken();
    }
    next();
  });
};
