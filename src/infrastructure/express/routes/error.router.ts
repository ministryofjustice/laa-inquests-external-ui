import type { Request, Response, Router } from "express";
import { HTTP_INTERNAL_SERVER_ERROR } from "#src/infrastructure/express/middleware/errors.js";

export function createErrorRouter(errorRouter: Router): Router {
  errorRouter.get("/error", (_req: Request, res: Response): void => {
    res.status(HTTP_INTERNAL_SERVER_ERROR).render("main/internal-server-error");
  });

  return errorRouter;
}
