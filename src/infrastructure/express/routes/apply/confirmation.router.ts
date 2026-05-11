import type { Request, Response, Router } from "express";

export function createConfirmationRouter(
  confirmationRouter: Router,
): Router {
  confirmationRouter.get(
    "/check-your-answers",
    (req: Request, res: Response): void => {
      const {
        locals: { csrfToken },
      } = res;

      res.render("apply/check-your-answers", { csrfToken });
    },
  );

  return confirmationRouter;
}
