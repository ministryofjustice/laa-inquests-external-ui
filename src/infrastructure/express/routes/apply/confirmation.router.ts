import type { NextFunction, Request, Response, Router } from "express";
import type { ConfirmationAdaptor } from "#src/adaptors/presenters/apply/Confirmation/Confirmation.adaptor.js";

export function createConfirmationRouter(
  confirmationRouter: Router,
  confirmationAdaptor: ConfirmationAdaptor,
): Router {
  confirmationRouter.get(
    "/check-your-answers",
    (req: Request, res: Response): void => {
      confirmationAdaptor.renderCheckYourAnswers(req, res);
    },
  );

  confirmationRouter.get(
    "/confirmation/client-declaration",
    (req: Request, res: Response): void => {
      confirmationAdaptor.renderClientDeclarationForm(req, res);
    },
  );

  confirmationRouter.post(
    "/confirmation/client-declaration",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        await confirmationAdaptor.processClientDeclarationForm(req, res);
      } catch (error: unknown) {
        next(error);
      }
    },
  );

  confirmationRouter.get(
    "/confirmation/success",
    (req: Request, res: Response): void => {
      confirmationAdaptor.renderConfirmSuccess(req, res);
    },
  );

  return confirmationRouter;
}
