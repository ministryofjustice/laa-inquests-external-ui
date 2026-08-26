import type { Request, Response, Router } from "express";
import type { PayingPartyAdaptor } from "#src/adaptors/presenters/claim/PayingParty/PayingParty.adaptor.js";

export function createPayingPartyRouter(
  payingPartyRouter: Router,
  payingPartyAdaptor: PayingPartyAdaptor,
): Router {
  payingPartyRouter.get(
    "/paying-party",
    (req: Request, res: Response): void => {
      payingPartyAdaptor.renderForm(req, res);
    },
  );

  payingPartyRouter.post(
    "/paying-party",
    (req: Request, res: Response): void => {
      payingPartyAdaptor.processForm(req, res);
    },
  );

  return payingPartyRouter;
}
