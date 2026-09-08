import type { NextFunction, Request, Response, Router } from "express";
import type { AuthAdaptor } from "#src/adaptors/presenters/auth/Auth.adaptor.js";
import { applySessionExpiry } from "#src/infrastructure/express/session/sessionExpiry.js";

const MILLISECONDS_IN_A_SECOND = 1000;

// Allows E2E tests to exercise office filtering by overriding the seeded office codes.
function parseOfficeAccountsQueryParam(value: unknown): string[] {
  if (typeof value !== "string") {
    return ["A001B", "A002B"];
  }
  return value
    .split(",")
    .map((officeCode) => officeCode.trim())
    .filter((officeCode) => officeCode !== "");
}

export function createAuthRouter(
  authRouter: Router,
  authAdaptor: AuthAdaptor,
): Router {
  authRouter.get(
    "/login",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        await authAdaptor.login(req, res);
      } catch (err: unknown) {
        next(err);
      }
    },
  );

  authRouter.get(
    "/callback",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        await authAdaptor.callback(req, res);
      } catch (err: unknown) {
        next(err);
      }
    },
  );

  authRouter.get(
    "/logout",
    (req: Request, res: Response, next: NextFunction): void => {
      authAdaptor.logout(req, res, next);
    },
  );

  // Test-only login endpoint that seeds a session without hitting Entra ID.
  // Never mounted outside the test environment.
  if (process.env.NODE_ENV === "test") {
    authRouter.get("/test-login", (req: Request, res: Response): void => {
      req.session.user = {
        name: "External Test [LAA]",
      };
      req.session.accessToken = "test-access-token";
      req.session.userId = "test-provider";
      req.session.firmId = "123";
      req.session.officeId = "A001B";
      req.session.userOfficeAccounts = parseOfficeAccountsQueryParam(
        req.query.officeAccounts,
      );
      req.session.providerEmail = "test@example.com";

      // Optional expiry to exercise session-expiry behaviour in E2E tests.
      const tokenExpirySeconds = Number(req.query.tokenExpirySeconds);
      if (!Number.isNaN(tokenExpirySeconds)) {
        applySessionExpiry(
          req.session,
          new Date(Date.now() + tokenExpirySeconds * MILLISECONDS_IN_A_SECOND),
        );
      }

      res.redirect("/");
    });
  }

  return authRouter;
}
