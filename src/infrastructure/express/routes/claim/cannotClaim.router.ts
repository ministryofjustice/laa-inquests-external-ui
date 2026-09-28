import type { Request, Response, Router } from "express";
import type { CannotClaimAdaptor } from "#src/adaptors/presenters/claim/CannotClaim/CannotClaim.adaptor.js";

export function createCannotClaimRouter(
  cannotClaimRouter: Router,
  cannotClaimAdaptor: CannotClaimAdaptor,
): Router {
  cannotClaimRouter.get(
    "/cannot-claim",
    (req: Request, res: Response): void => {
      cannotClaimAdaptor.renderPage(req, res);
    },
  );

  return cannotClaimRouter;
}
