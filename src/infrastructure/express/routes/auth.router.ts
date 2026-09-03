import type { NextFunction, Request, Response, Router } from "express";
import type { AuthAdaptor } from "#src/adaptors/presenters/auth/Auth.adaptor.js";
import { applySessionExpiry } from "#src/infrastructure/express/session/sessionExpiry.js";

const MILLISECONDS_IN_A_SECOND = 1000;

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
      req.session.officeId = "001";
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
