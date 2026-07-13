import type { Request, Response, Router } from "express";
import type { TotalClaimAdaptor } from "#src/adaptors/presenters/claim/TotalClaim/TotalClaim.adaptor.js";

export function createTotalClaimRouter(
  totalClaimRouter: Router,
  totalClaimAdaptor: TotalClaimAdaptor,
): Router {
  totalClaimRouter.get("/total-cost", (req: Request, res: Response): void => {
    totalClaimAdaptor.renderForm(req, res);
  });

  totalClaimRouter.post("/total-cost", (req: Request, res: Response): void => {
    totalClaimAdaptor.processForm(req, res);
  });

  return totalClaimRouter;
}
