import type { EvidenceAdaptor } from "#src/adaptors/presenters/apply/Evidence/Evidence.adaptor.js";
import type { Request, Response, Router } from "express";
import multer from "multer";
import { MAX_FILE_SIZE_BYTES } from "#src/infrastructure/locales/constants.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES * 2 },
});

export function createEvidenceRouter(
  evidenceRouter: Router,
  evidenceAdaptor: EvidenceAdaptor,
): Router {
  evidenceRouter.get("/evidence/upload", (req: Request, res: Response): void => {
    evidenceAdaptor.renderUploadCoronersLetterForm(req, res);
  });

  evidenceRouter.post(
    "/evidence/upload",
    upload.single("coroners-letter"),
    (req: Request, res: Response): void => {
      void evidenceAdaptor.processUploadCoronersLetterForm(req, res);
    },
  );

  evidenceRouter.post("/evidence/delete", (req: Request, res: Response): void => {
    evidenceAdaptor.deleteUploadedFile(req, res);
  });

  return evidenceRouter;
}
