import type { Request, Response, Router } from "express";

export function createDeceasedDetailsRouter(
  clientDetailsRouter: Router,
): Router {
  clientDetailsRouter.get(
    "/deceased-details/name",
    (req: Request, res: Response): void => {
      res.render("apply/deceased-details/name");
    },
  );

  clientDetailsRouter.post(
    "/deceased-details/name",
    (req: Request, res: Response): void => {
      console.log("!!!!!!!!!!!!!!");
      res.redirect("/apply/deceased-details/dod");
    },
  );

  return clientDetailsRouter;
}
