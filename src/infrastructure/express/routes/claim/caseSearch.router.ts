import type { Request, Response, Router } from "express";
import type { CaseSearchAdaptor } from "#src/adaptors/presenters/claim/CaseSearch/CaseSearch.adaptor.js";

export function createCaseSearchRouter(
  caseSearchRouter: Router,
  caseSearchAdaptor: CaseSearchAdaptor,
): Router {
  caseSearchRouter.get("/", (req: Request, res: Response): void => {
    caseSearchAdaptor.renderForm(req, res);
  });

  caseSearchRouter.post("/", (req: Request, res: Response): void => {
    caseSearchAdaptor.processForm(req, res);
  });

  return caseSearchRouter;
}
