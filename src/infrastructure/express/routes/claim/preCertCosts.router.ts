import type { Request, Response, Router } from "express";
import type { PreCertificateCostsAdaptor } from "#src/adaptors/presenters/claim/PreCertificateCosts/PreCertificateCosts.adaptor.js";

export function createPreCertCostsRouter(
  preCertCostsRouter: Router,
  preCertificateCostsAdaptor: PreCertificateCostsAdaptor,
): Router {
  preCertCostsRouter.get(
    "/pre-cert-costs",
    (req: Request, res: Response): void => {
      preCertificateCostsAdaptor.renderForm(req, res);
    },
  );

  preCertCostsRouter.post(
    "/pre-cert-costs",
    (req: Request, res: Response): void => {
      preCertificateCostsAdaptor.processForm(req, res);
    },
  );

  return preCertCostsRouter;
}
