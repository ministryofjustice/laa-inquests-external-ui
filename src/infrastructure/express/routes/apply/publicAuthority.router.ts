import type { PublicAuthorityAdaptor } from "#src/adaptors/presenters/apply/PublicAuthority/PublicAuthority.adaptor.js";
import type { Request, Response, Router } from "express";

export function createPublicAuthorityRouter(
  publicAuthorityRouter: Router,
  publicAuthorityAdaptor: PublicAuthorityAdaptor,
): Router {
  publicAuthorityRouter.get(
    "/public-authority",
    async (req: Request, res: Response): Promise<void> => {
      await publicAuthorityAdaptor.renderPublicAuthoritySelectForm(req, res);
    },
  );

  publicAuthorityRouter.post(
    "/public-authority",
    async (req: Request, res: Response): Promise<void> => {
      await publicAuthorityAdaptor.processPublicAuthorityForm(req, res);
    },
  );

  return publicAuthorityRouter;
}
