import type { Request, Response, Router } from "express";
import type { InquestOutcomeAdaptor } from "#src/adaptors/presenters/claim/InquestOutcome/InquestOutcome.adaptor.js";

export function createInquestOutcomeRouter(
  inquestOutcomeRouter: Router,
  inquestOutcomeAdaptor: InquestOutcomeAdaptor,
): Router {
  inquestOutcomeRouter.get(
    "/inquest-outcome",
    (req: Request, res: Response): void => {
      inquestOutcomeAdaptor.renderForm(req, res);
    },
  );

  inquestOutcomeRouter.post(
    "/inquest-outcome",
    (req: Request, res: Response): void => {
      inquestOutcomeAdaptor.processForm(req, res);
    },
  );

  return inquestOutcomeRouter;
}
