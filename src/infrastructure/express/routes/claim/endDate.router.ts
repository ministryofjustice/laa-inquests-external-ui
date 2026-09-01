import type { Request, Response, Router } from "express";
import type { EndDateAdaptor } from "#src/adaptors/presenters/claim/EndDate/EndDate.adaptor.js";

export function createEndDateRouter(
  endDateRouter: Router,
  endDateAdaptor: EndDateAdaptor,
): Router {
  endDateRouter.get("/end-date", (req: Request, res: Response): void => {
    endDateAdaptor.renderForm(req, res);
  });

  endDateRouter.post("/end-date", (req: Request, res: Response): void => {
    endDateAdaptor.processForm(req, res);
  });

  return endDateRouter;
}
