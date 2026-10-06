import type { Request, Response, Router } from "express";
import type { ClaimDeclarationAdaptor } from "#src/adaptors/source/inquests-api/claim/ClaimDeclaration/ClaimDeclaration.adaptor.js";

export function createClaimDeclarationRouter(
  claimDeclarationRouter: Router,
  claimDeclarationAdaptor: ClaimDeclarationAdaptor,
): Router {
  claimDeclarationRouter.get("/", (req: Request, res: Response): void => {
    claimDeclarationAdaptor.renderForm(req, res);
  });

  claimDeclarationRouter.post("/", (req: Request, res: Response): void => {
    claimDeclarationAdaptor.processForm(req, res);
  });

  return claimDeclarationRouter;
}
