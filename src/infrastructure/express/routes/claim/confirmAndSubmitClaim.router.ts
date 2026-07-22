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
    async (req: Request, res: Response): Promise<void> => {
      await confirmAndSubmitAdaptor.processForm(req, res);
    },
  );

  confirmAndSubmitClaimRouter.get(
    "/confirmation/success",
    (req: Request, res: Response): void => {
      confirmAndSubmitAdaptor.renderConfirmSuccess(req, res);
    },
  );

  confirmAndSubmitClaimRouter.get(
    "/confirmation/reject",
    (req: Request, res: Response): void => {
      confirmAndSubmitAdaptor.renderConfirmReject(req, res);
    },
  );

  return confirmAndSubmitClaimRouter;
}
