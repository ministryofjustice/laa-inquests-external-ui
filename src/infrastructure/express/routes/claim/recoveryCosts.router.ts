import type { Request, Response, Router } from "express";
import type { FinancialRecoveryCostsAdaptor } from "#src/adaptors/presenters/claim/FinancialRecoveryCosts/FinancialRecoveryCosts.adaptor.js";

export function createRecoveryCostsRouter(
  recoveryCostsRouter: Router,
  financialRecoveryCostsAdaptor: FinancialRecoveryCostsAdaptor,
): Router {
  recoveryCostsRouter.get(
    "/recovery-costs",
    (req: Request, res: Response): void => {
      financialRecoveryCostsAdaptor.renderForm(req, res);
    },
  );

  recoveryCostsRouter.post(
    "/recovery-costs",
    (req: Request, res: Response): void => {
      financialRecoveryCostsAdaptor.processForm(req, res);
    },
  );

  return recoveryCostsRouter;
}
