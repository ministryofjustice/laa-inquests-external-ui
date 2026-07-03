import type { Request, Response, Router } from "express";
import type { ClaimTypeAdaptor } from "#src/adaptors/presenters/claim/ClaimType/ClaimType.adaptor.js";

export function createClaimTypeRouter(
  claimTypeRouter: Router,
  claimTypeAdaptor: ClaimTypeAdaptor,
): Router {
  claimTypeRouter.get("/type", (req: Request, res: Response): void => {
    claimTypeAdaptor.renderForm(req, res);
  });

  claimTypeRouter.post("/type", (req: Request, res: Response): void => {
    claimTypeAdaptor.processForm(req, res);
  });

  return claimTypeRouter;
}
