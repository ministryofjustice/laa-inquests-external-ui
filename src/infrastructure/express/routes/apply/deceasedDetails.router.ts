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

  deceasedDetailsRouter.get(
    "/deceased-details/dod",
    (req: Request, res: Response): void => {
      deceasedDetailsAdaptor.renderDateOfDeathForm(req, res);
    },
  );

  deceasedDetailsRouter.post(
    "/deceased-details/dod",
    (req: Request, res: Response): void => {
      deceasedDetailsAdaptor.processDateOfDeathForm(req, res);
    },
  );

  deceasedDetailsRouter.get(
    "/deceased-details/dob",
    (req: Request, res: Response): void => {
      res.render("apply/deceased-details/dob");
    },
  );

  deceasedDetailsRouter.post(
    "/deceased-details/dob",
    (req: Request, res: Response): void => {
      res.redirect("apply/deceased-details/client-relationship");
    },
  );

  return deceasedDetailsRouter;
}
