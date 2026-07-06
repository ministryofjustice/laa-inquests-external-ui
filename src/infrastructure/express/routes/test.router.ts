import type { Router, Request, Response } from "express";
import type { Session } from "express-session";

export default function createTestRouter(router: Router): Router {
  const SUCCESSFUL_REQUEST = 200;

  router.get(
    "/test/auth-session",
    (
      req: Request & {
        session: Session & {
          userId?: string;
          user?: { name?: string };
          firmCode?: string;
          officeId?: string;
          providerEmail?: string;
          accessToken?: string;
        };
      },
      res: Response,
    ): void => {
      req.session.userId = "test-user-id";
      req.session.user = { name: "Test User" };
      req.session.firmCode = "0A123B";
      req.session.officeId = "001";
      req.session.providerEmail = "test@example.com";
      req.session.accessToken = "test-access-token";
      req.session.save(() => {
        res.status(SUCCESSFUL_REQUEST).send("Session was seeded successfully.");
      });
    },
  );

  return router;
}
