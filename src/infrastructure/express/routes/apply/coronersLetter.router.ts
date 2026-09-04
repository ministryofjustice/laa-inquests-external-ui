import type { CoronersLetterAdaptor } from "#src/adaptors/presenters/apply/CoronersLetter/CoronersLetter.adaptor.js";
import type { Request, Response, Router } from "express";
import { registerFileUploadRoutes } from "#src/infrastructure/express/routes/claim/fileUploadRoutes.shared.js";

export function createCoronersLetterRouter(
  coronersLetterRouter: Router,
  coronersLetterAdaptor: CoronersLetterAdaptor,
): Router {
  return registerFileUploadRoutes(coronersLetterRouter, {
    basePath: "/upload-coroners-letter",
    renderForm: (req: Request, res: Response): void => {
      coronersLetterAdaptor.renderUploadCoronersLetterForm(req, res);
    },
    processForm: (req: Request, res: Response): void => {
      coronersLetterAdaptor.processCoronersLetterContinue(req, res);
    },
    processUpload: async (req: Request, res: Response): Promise<void> => {
      await coronersLetterAdaptor.processCoronersLetterUpload(req, res);
    },
    processDelete: async (req: Request, res: Response): Promise<void> => {
      await coronersLetterAdaptor.processCoronersLetterDelete(req, res);
    },
  });
}
