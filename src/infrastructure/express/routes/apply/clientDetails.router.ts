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
    "/client-details/home-address",
    (req: Request, res: Response): void => {
      clientDetailsAdaptor.renderHomeAddressForm(req, res);
    },
  );

  clientDetailsRouter.post(
    "/client-details/home-address",
    (req: Request, res: Response): void => {
      clientDetailsAdaptor.processHomeAddressForm(req, res);
    },
  );

  clientDetailsRouter.get(
    "/client-details/correspondence-address-source",
    (req: Request, res: Response): void => {
      clientDetailsAdaptor.renderCorrespondenceAddressSourceForm(req, res);
    },
  );

  clientDetailsRouter.post(
    "/client-details/correspondence-address-source",
    (req: Request, res: Response): void => {
      clientDetailsAdaptor.processCorrespondenceAddressSourceForm(req, res);
    },
  );

  clientDetailsRouter.get(
    "/client-details/correspondence-address",
    (req: Request, res: Response): void => {
      clientDetailsAdaptor.renderCorrespondenceAddressForm(req, res);
    },
  );

  clientDetailsRouter.post(
    "/client-details/correspondence-address",
    (req: Request, res: Response): void => {
      clientDetailsAdaptor.processCorrespondenceAddressForm(req, res);
    },
  );

  clientDetailsRouter.get(
    "/client-details/correspondence-recipient",
    (req: Request, res: Response): void => {
      clientDetailsAdaptor.renderCorrespondenceRecipientForm(req, res);
    },
  );

  clientDetailsRouter.post(
    "/client-details/correspondence-recipient",
    (req: Request, res: Response): void => {
      clientDetailsAdaptor.processCorrespondenceRecipientForm(req, res);
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
