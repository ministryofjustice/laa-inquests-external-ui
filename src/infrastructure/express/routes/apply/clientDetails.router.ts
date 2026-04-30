import type { Request, Response, Router } from "express";
// import type { ClientDetailsAdaptor } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.js";

export function createClientDetailsRouter(clientDetailsRouter: Router
): Router {

  clientDetailsRouter.get(
    "/apply/client-details/name-and-dob",
    (req: Request, res: Response): void => {
      console.log(res);
      // eslint-disable-next-line @typescript-eslint/prefer-destructuring -- Temporary disable
      const { csrfToken } = res.locals;
      console.log(csrfToken);
      res.render("apply/client-details/name-and-dob", { csrfToken });
    },
  );

  clientDetailsRouter.post(
    "/apply/client-details/name-and-dob",
    (req: Request, res: Response): void => {
      console.log(req.body);
      res.redirect("/apply/client-details/nino");
    },
  );

  clientDetailsRouter.get(
    "/apply/client-details/nino",
    (req: Request, res: Response): void => {
      // eslint-disable-next-line @typescript-eslint/prefer-destructuring -- Temporary disable
      const { csrfToken } = res.locals;
      res.render("apply/client-details/nino", { csrfToken });
    },
  );

  clientDetailsRouter.post(
    "/apply/client-details/nino",
    (req: Request, res: Response): void => {
      console.log(req.body);
      res.redirect("/apply/client-details/legal-aid-request");
    },
  );
  return clientDetailsRouter
}
