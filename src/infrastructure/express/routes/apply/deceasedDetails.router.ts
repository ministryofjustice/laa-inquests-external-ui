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
      deceasedDetailsAdaptor.renderDateOfBirthForm(req, res);
    },
  );

  deceasedDetailsRouter.post(
    "/deceased-details/dob",
    (req: Request, res: Response): void => {
      deceasedDetailsAdaptor.processDateOfBirthForm(req, res);
    },
  );

  deceasedDetailsRouter.get(
    "/deceased-details/client-relationship",
    (req: Request, res: Response): void => {
      deceasedDetailsAdaptor.renderClientRelationshipForm(req, res);
    },
  );

  deceasedDetailsRouter.post(
    "/deceased-details/client-relationship",
    (req: Request, res: Response): void => {
      deceasedDetailsAdaptor.processClientRelationshipForm(req, res);
    },
  );

  deceasedDetailsRouter.get(
    "/deceased-details/coroner-reference",
    (req: Request, res: Response): void => {
      deceasedDetailsAdaptor.renderCoronerReferenceForm(req, res);
    },
  );

  deceasedDetailsRouter.post(
    "/deceased-details/coroner-reference",
    (req: Request, res: Response): void => {
      deceasedDetailsAdaptor.processCoronerReferenceForm(req, res);
    },
  );

  deceasedDetailsRouter.get(
    "/deceased-details/further-information",
    (req: Request, res: Response): void => {
      res.render("apply/deceased-details/further-information", {
        deceasedDetails: {
          hasFurtherInformation: req.session.deceasedHasFurtherInformation,
          furtherInformation: req.session.deceasedFurtherInformation,
        },
      });
    },
  );

  deceasedDetailsRouter.post(
    "/deceased-details/further-information",
    (req: Request, res: Response): void => {
      req.session.deceasedHasFurtherInformation = "true";
      req.session.deceasedFurtherInformation = "Test";

      res.redirect("apply/interested-parties");
    },
  );

  return deceasedDetailsRouter;
}
