import type { Request, Response, Router } from "express";
import type { FundingPostInquestAdaptor } from "#src/adaptors/presenters/claim/FundingPostInquest/FundingPostInquest.adaptor.js";

export function createFundingPostInquestRouter(
  fundingPostInquestRouter: Router,
  fundingPostInquestAdaptor: FundingPostInquestAdaptor,
): Router {
  fundingPostInquestRouter.get(
    "/funding-post-inquest",
    (req: Request, res: Response): void => {
      fundingPostInquestAdaptor.renderForm(req, res);
    },
  );

  fundingPostInquestRouter.post(
    "/funding-post-inquest",
    (req: Request, res: Response): void => {
      fundingPostInquestAdaptor.processForm(req, res);
    },
  );

  return fundingPostInquestRouter;
}
