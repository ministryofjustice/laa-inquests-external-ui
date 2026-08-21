import type { Request, Response, Router } from "express";
import type { CounselNumberAdaptor } from "#src/adaptors/presenters/claim/CounselNumber/CounselNumber.adaptor.js";
import type { CounselPayConfirmationAdaptor } from "#src/adaptors/presenters/claim/CounselPayConfirmation/CounselPayConfirmation.adaptor.js";

export function createCounselRouter(
  counselRouter: Router,
  counselNumberAdaptor: CounselNumberAdaptor,
  counselPayConfirmationAdaptor: CounselPayConfirmationAdaptor,
): Router {
  counselRouter.get("/counsel-number", (req: Request, res: Response): void => {
    counselNumberAdaptor.renderForm(req, res);
  });

  counselRouter.post("/counsel-number", (req: Request, res: Response): void => {
    counselNumberAdaptor.processForm(req, res);
  });

  counselRouter.get(
    "/counsel-pay-confirmation",
    (req: Request, res: Response): void => {
      counselPayConfirmationAdaptor.renderForm(req, res);
    },
  );

  counselRouter.post(
    "/counsel-pay-confirmation",
    (req: Request, res: Response): void => {
      counselPayConfirmationAdaptor.processForm(req, res);
    },
  );

  return counselRouter;
}
