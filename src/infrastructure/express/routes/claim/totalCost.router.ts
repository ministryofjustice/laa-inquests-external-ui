import type { Request, Response, Router } from "express";
import type { TotalCostAdaptor } from "#src/adaptors/presenters/claim/TotalCost/TotalCost.adaptor.js";

export function createTotalCostRouter(
  totalCostRouter: Router,
  totalCostAdaptor: TotalCostAdaptor,
): Router {
  totalCostRouter.get("/total-cost", (req: Request, res: Response): void => {
    totalCostAdaptor.renderForm(req, res);
  });

  totalCostRouter.post("/total-cost", (req: Request, res: Response): void => {
    totalCostAdaptor.processForm(req, res);
  });

  return totalCostRouter;
}
