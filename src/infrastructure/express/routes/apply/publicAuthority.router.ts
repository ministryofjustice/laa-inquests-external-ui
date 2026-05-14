import type { PublicAuthorityAdaptor } from "#src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.js";
import type { Request, Response, Router } from "express";

export function createPublicAuthorityRouter(
  publicAuthorityRouter: Router,
  publicAuthorityAdaptor: PublicAuthorityAdaptor,
): Router {
  publicAuthorityRouter.get(
    "/public-authority",
    (req: Request, res: Response): void => {
      publicAuthorityAdaptor.renderPublicAuthoritySelectForm(req, res);
    },
  );

  publicAuthorityRouter.post(
    "/public-authority",
    (req: Request, res: Response) => {
      publicAuthorityAdaptor.processPublicAuthorityForm(req, res);
    },
  );

  publicAuthorityRouter.get(
    "/public-authority/confirmation",
    (req: Request, res: Response) => {
      publicAuthorityAdaptor.renderPublicAuthorityConfirmation(req, res);
    },
  );

  publicAuthorityRouter.post(
    "/public-authority/confirmation",
    (req: Request, res: Response) => {
      publicAuthorityAdaptor.processPublicAuthorityConfirmation(req, res);
    },
  );

  return publicAuthorityRouter;
}
