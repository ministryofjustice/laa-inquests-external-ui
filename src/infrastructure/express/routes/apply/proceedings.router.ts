import type { ProceedingsAdaptor } from "#src/adaptors/presenters/apply/Proceeding/Proceedings.adaptor.js";
import type { Request, Response, Router } from "express";

export function createProceedingsRouter(
  proceedingsRouter: Router,
  proceedingsAdaptor: ProceedingsAdaptor,
): Router {
  proceedingsRouter.get("/proceeding", (req: Request, res: Response): void => {
    proceedingsAdaptor.renderProceedingSelectForm(req, res);
  });

  proceedingsRouter.post("/proceeding", (req: Request, res: Response) => {
    proceedingsAdaptor.processProceedingsForm(req, res);
  });

  return proceedingsRouter;
}
