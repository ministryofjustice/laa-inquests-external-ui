import type { CoronersLetterAdaptor } from "#src/adaptors/presenters/apply/CoronersLetter/CoronersLetter.adaptor.js";
import type { Request, Response, Router } from "express";

export function createCoronersLetterRouter(
  coronersLetterRouter: Router,
  coronersLetterAdaptor: CoronersLetterAdaptor,
): Router {
  coronersLetterRouter.get(
    "/upload-coroners-letter",
    (req: Request, res: Response): void => {
      coronersLetterAdaptor.renderUploadCoronersLetterForm(req, res);
    },
  );

  coronersLetterRouter.post(
    "/upload-coroners-letter",
    async (req: Request, res: Response): Promise<void> => {
      await coronersLetterAdaptor.processCoronersLetterUploadForm(req, res);
    },
  );

  return coronersLetterRouter;
}
