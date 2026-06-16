import type { EvidenceAdaptor } from "#src/adaptors/presenters/apply/Evidence/Evidence.adaptor.js";
import type { Request, Response, Router } from "express";

export function createEvidenceRouter(
  evidenceRouter: Router,
  evidenceAdaptor: EvidenceAdaptor,
): Router {
  evidenceRouter.get("/upload", (req: Request, res: Response): void => {
    evidenceAdaptor.renderUploadCoronersLetterForm(req, res);
  });

  return evidenceRouter;
}
