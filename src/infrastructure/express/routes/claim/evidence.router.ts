import type { Request, Response, Router } from "express";
import type { EvidenceAdaptor } from "#src/adaptors/presenters/claim/Evidence/Evidence.adaptor.js";
import type { DownloadEvidenceAdaptor } from "#src/adaptors/presenters/claim/DownloadEvidence/DownloadEvidence.adaptor.js";
import { registerFileUploadRoutes } from "./fileUploadRoutes.shared.js";

export function createEvidenceRouter(
  evidenceRouter: Router,
  evidenceAdaptor: EvidenceAdaptor,
  downloadEvidenceAdaptor: DownloadEvidenceAdaptor,
): Router {
  return registerFileUploadRoutes(evidenceRouter, {
    basePath: "/evidence",
    renderForm: (req: Request, res: Response): void => {
      evidenceAdaptor.renderForm(req, res);
    },
    processForm: (req: Request, res: Response): void => {
      evidenceAdaptor.processForm(req, res);
    },
    processUpload: async (req: Request, res: Response): Promise<void> => {
      await evidenceAdaptor.processEvidenceUpload(req, res);
    },
    processDelete: async (req: Request, res: Response): Promise<void> => {
      await evidenceAdaptor.processEvidenceDelete(req, res);
    },
    viewFile: async (req: Request, res: Response): Promise<void> => {
      await downloadEvidenceAdaptor.viewEvidence(req, res);
    },
    downloadFile: async (req: Request, res: Response): Promise<void> => {
      await downloadEvidenceAdaptor.downloadEvidence(req, res);
    },
  });
}
