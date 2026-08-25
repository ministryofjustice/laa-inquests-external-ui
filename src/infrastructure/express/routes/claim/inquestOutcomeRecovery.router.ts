import type { Request, Response, Router } from "express";
import type { RecoveryCostMadeAdaptor } from "#src/adaptors/presenters/claim/RecoveryCostMade/RecoveryCostMade.adaptor.js";

export function createInquestOutcomeRecoveryRouter(
  inquestOutcomeRecoveryRouter: Router,
  recoveryCostMadeAdaptor: RecoveryCostMadeAdaptor,
): Router {
  inquestOutcomeRecoveryRouter.get(
    "/inquest-outcome-recovery",
    (req: Request, res: Response): void => {
      recoveryCostMadeAdaptor.renderForm(req, res);
    },
  );

  inquestOutcomeRecoveryRouter.post(
    "/inquest-outcome-recovery",
    (req: Request, res: Response): void => {
      recoveryCostMadeAdaptor.processForm(req, res);
    },
  );

  return inquestOutcomeRecoveryRouter;
}
