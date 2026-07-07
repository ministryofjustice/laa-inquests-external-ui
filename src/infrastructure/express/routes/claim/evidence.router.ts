import type { Request, Response, Router } from "express";
import type { EvidenceAdaptor } from "#src/adaptors/presenters/claim/Evidence/Evidence.adaptor.js";

export function createEvidenceRouter(
  evidenceRouter: Router,
  evidenceAdaptor: EvidenceAdaptor,
): Router {
  evidenceRouter.get("/evidence", (req: Request, res: Response): void => {
    evidenceAdaptor.renderForm(req, res);
  });

  evidenceRouter.post("/evidence", (req: Request, res: Response): void => {
    evidenceAdaptor.processForm(req, res);
  });

  return evidenceRouter;
}
