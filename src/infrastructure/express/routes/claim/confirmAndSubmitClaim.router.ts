import type { Request, Response, Router } from "express";
import type { ConfirmAndSubmitAdaptor } from "#src/adaptors/presenters/claim/ConfirmAndSubmit/ConfirmAndSubmit.adaptor.js";

export function createConfirmAndSubmitClaimRouter(
  confirmAndSubmitClaimRouter: Router,
  confirmAndSubmitAdaptor: ConfirmAndSubmitAdaptor,
): Router {
  confirmAndSubmitClaimRouter.get(
    "/check-your-answers",
    (req: Request, res: Response): void => {
      confirmAndSubmitAdaptor.renderForm(req, res);
    },
  );

  confirmAndSubmitClaimRouter.post(
    "/check-your-answers",
    (req: Request, res: Response): void => {
      confirmAndSubmitAdaptor.processForm(req, res);
    },
  );

  return confirmAndSubmitClaimRouter;
}
