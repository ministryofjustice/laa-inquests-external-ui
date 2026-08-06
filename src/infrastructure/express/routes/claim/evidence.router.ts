import type { Request, Response, Router } from "express";
import type { EvidenceAdaptor } from "#src/adaptors/presenters/claim/Evidence/Evidence.adaptor.js";
import type { DownloadEvidenceAdaptor } from "#src/adaptors/presenters/claim/DownloadEvidence/DownloadEvidence.adaptor.js";

export function createEvidenceRouter(
  evidenceRouter: Router,
  evidenceAdaptor: EvidenceAdaptor,
  downloadEvidenceAdaptor: DownloadEvidenceAdaptor,
): Router {
  evidenceRouter.get("/evidence", (req: Request, res: Response): void => {
    evidenceAdaptor.renderForm(req, res);
  });

  evidenceRouter.post("/evidence", (req: Request, res: Response): void => {
    evidenceAdaptor.processForm(req, res);
  });

  evidenceRouter.post(
    "/evidence/upload",
    async (req: Request, res: Response): Promise<void> => {
      await evidenceAdaptor.processEvidenceUpload(req, res);
    },
  );

  evidenceRouter.post(
    "/evidence/delete",
    async (req: Request, res: Response): Promise<void> => {
      await evidenceAdaptor.processEvidenceDelete(req, res);
    },
  );

  evidenceRouter.get(
    "/evidence/:evidenceId/view",
    async (req: Request, res: Response): Promise<void> => {
      await downloadEvidenceAdaptor.viewEvidence(req, res);
    },
  );

  evidenceRouter.get(
    "/evidence/:evidenceId/download",
    async (req: Request, res: Response): Promise<void> => {
      await downloadEvidenceAdaptor.downloadEvidence(req, res);
    },
  );

  return evidenceRouter;
}
