import express from "express";
import type { Router } from "express";

export function createAppWithSession(
  router: Router,
  sharedSession: Record<string, unknown>,
): express.Express {
  const app = express();

  app.use(express.json());
  app.use((req, _res, next) => {
    (req as unknown as { session: Record<string, unknown> }).session =
      sharedSession;
    next();
  });

  app.use(router);

  return app;
}
