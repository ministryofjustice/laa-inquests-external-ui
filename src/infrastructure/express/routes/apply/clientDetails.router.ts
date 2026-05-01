import type { Request, Response, Router } from "express";
// import type { ClientDetailsAdaptor } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.js";

export function createClientDetailsRouter(clientDetailsRouter: Router): Router {
  clientDetailsRouter.get(
    "/client-details/name-and-dob",
    (req: Request, res: Response): void => {
      console.log(res);
      // eslint-disable-next-line @typescript-eslint/prefer-destructuring -- Temporary disable
      const { csrfToken } = res.locals;
      console.log(csrfToken);
      res.render("apply/client-details/name-and-dob", { csrfToken });
    },
  );

  clientDetailsRouter.post(
    "/client-details/name-and-dob",
    (req: Request, res: Response): void => {
      console.log(req.body);
      res.redirect("/apply/client-details/nino");
    },
  );

  clientDetailsRouter.get(
    "/client-details/nino",
    (req: Request, res: Response): void => {
      // eslint-disable-next-line @typescript-eslint/prefer-destructuring -- Temporary disable
      const { csrfToken } = res.locals;
      res.render("apply/client-details/nino", { csrfToken });
    },
  );

  clientDetailsRouter.post(
    "/client-details/nino",
    (req: Request, res: Response): void => {
      console.log(req.body);
      res.redirect("/apply/client-details/has-prev-application");
    },
  );

  clientDetailsRouter.get(
    "/client-details/has-prev-application",
    (req: Request, res: Response) => {
      // eslint-disable-next-line @typescript-eslint/prefer-destructuring -- Temporary disable
      const { csrfToken } = res.locals;
      res.render("apply/client-details/has-prev-application", { csrfToken });
    },
  );

  clientDetailsRouter.post(
    "/client-details/has-prev-application",
    (req: Request, res: Response) => {
      console.log(req.body);
      res.redirect("/apply/client-details/proceedings");
    },
  );

  return clientDetailsRouter;
}
