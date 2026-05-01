import type { Request, Response, Router } from "express";
import type { ClientDetailsAdaptor } from "#src/adaptors/presenters/apply/ClientDetails/ClientDetails.adaptor.js";

export function createClientDetailsRouter(
  clientDetailsRouter: Router,
  clientDetailsAdaptor: ClientDetailsAdaptor,
): Router {
  clientDetailsRouter.get(
    "/client-details/name-and-dob",
    (req: Request, res: Response): void => {
      clientDetailsAdaptor.renderNameForm(req, res);
    },
  );

  clientDetailsRouter.post(
    "/client-details/name-and-dob",
    (req: Request, res: Response): void => {
      clientDetailsAdaptor.processNameForm(req, res);
    },
  );

  clientDetailsRouter.get(
    "/client-details/nino",
    (req: Request, res: Response): void => {
      clientDetailsAdaptor.renderNinoForm(req, res);
    },
  );

  clientDetailsRouter.post(
    "/client-details/nino",
    (req: Request, res: Response): void => {
      clientDetailsAdaptor.processNinoForm(req, res);
    },
  );

  clientDetailsRouter.get(
    "/client-details/has-prev-application",
    (req: Request, res: Response) => {
      clientDetailsAdaptor.renderHasPrevApplicationForm(req, res);
    },
  );

  clientDetailsRouter.post(
    "/client-details/has-prev-application",
    (req: Request, res: Response) => {
      clientDetailsAdaptor.processHasPrevApplicationForm(req, res);
    },
  );

  return clientDetailsRouter;
}
