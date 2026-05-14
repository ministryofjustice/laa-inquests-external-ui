import type { Request, Response, Router } from "express";
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

  return confirmationRouter;
}
