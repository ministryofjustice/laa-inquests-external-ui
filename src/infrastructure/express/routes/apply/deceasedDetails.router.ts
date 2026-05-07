import type { DeceasedDetailsAdaptor } from "#src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.adaptor.js";
import type { Request, Response, Router } from "express";

export function createDeceasedDetailsRouter(
  deceasedDetailsRouter: Router,
  deceasedDetailsAdaptor: DeceasedDetailsAdaptor,
): Router {
  deceasedDetailsRouter.get(
    "/deceased-details/name",
    (req: Request, res: Response): void => {
      deceasedDetailsAdaptor.renderNameForm(req, res);
    },
  );

  deceasedDetailsRouter.post(
    "/deceased-details/name",
    (req: Request, res: Response): void => {
      deceasedDetailsAdaptor.processNameForm(req, res);
    },
  );

  return deceasedDetailsRouter;
}
