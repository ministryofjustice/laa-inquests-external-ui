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

  return publicAuthorityRouter;
}
