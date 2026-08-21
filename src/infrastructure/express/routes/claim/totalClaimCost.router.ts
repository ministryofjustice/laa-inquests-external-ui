import type { Request, Response, Router } from "express";
import type { TotalClaimCostAdaptor } from "#src/adaptors/presenters/claim/TotalClaimCost/TotalClaimCost.adaptor.js";

export function createTotalClaimCostRouter(
  totalClaimRouter: Router,
  totalClaimCostAdaptor: TotalClaimCostAdaptor,
): Router {
  totalClaimRouter.get("/total-cost", (req: Request, res: Response): void => {
    totalClaimCostAdaptor.renderForm(req, res);
  });

  totalClaimRouter.post("/total-cost", (req: Request, res: Response): void => {
    totalClaimCostAdaptor.processForm(req, res);
  });

  return totalClaimRouter;
}
