import type { Request, Response, Router } from "express";
import type { ApplicationDeclarationAdaptor } from "#src/adaptors/presenters/apply/ApplicationDeclaration/ApplicationDeclaration.adaptor.js";

export function createApplicationDeclarationRouter(
  applicationDeclarationRouter: Router,
  applicationDeclarationAdaptor: ApplicationDeclarationAdaptor,
): Router {
  applicationDeclarationRouter.get("/", (req: Request, res: Response): void => {
    applicationDeclarationAdaptor.renderForm(req, res);
  });
  applicationDeclarationRouter.post(
    "/",
    (req: Request, res: Response): void => {
      applicationDeclarationAdaptor.processForm(req, res);
    },
  );
  return applicationDeclarationRouter;
}
