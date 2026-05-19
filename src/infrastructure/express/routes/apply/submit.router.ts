import type { SubmitAdaptor } from "#src/adaptors/presenters/apply/Submit/Submit.adaptor.js";
import type { Request, Response, Router } from "express";

export function createSubmitRouter(
  submitRouter: Router,
  submitAdaptor: SubmitAdaptor,
): Router {
  submitRouter.get(
    "/confirmation/client-declaration",
    (req: Request, res: Response): void => {
      submitAdaptor.renderClientDeclarationForm(req, res);
    },
  );

  submitRouter.post(
    "/confirmation/client-declaration",
    async (req: Request, res: Response): Promise<void> => {
      await submitAdaptor.processClientDeclarationForm(req, res);
    },
  );

  return submitRouter;
}
