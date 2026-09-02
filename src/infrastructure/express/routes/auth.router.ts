import type { NextFunction, Request, Response, Router } from "express";
import type { AuthAdaptor } from "#src/adaptors/presenters/auth/Auth.adaptor.js";

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
      req.session.roles = ["test-role"];
      res.redirect("/");
    });
  }

  return authRouter;
}
