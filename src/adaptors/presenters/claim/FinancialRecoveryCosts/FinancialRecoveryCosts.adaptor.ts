import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";

export interface FinancialRecoveryCostsFormData {
  costs?: string;
  damages?: string;
  interest?: string;
  "previous-pre-certificate-costs"?: string;
}

export class FinancialRecoveryCostsAdaptor {
  navigationHelper: ClaimNavigationHelper;

  constructor(
    navigationHelper: ClaimNavigationHelper = new ClaimNavigationHelper(),
  ) {
    this.navigationHelper = navigationHelper;
  }

  renderForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    this.navigationHelper.captureCheckYourAnswersEntry(req);

    res.render("claim/recovery-costs", {
      csrfToken,
      costs: req.session.claim?.recoveryCosts,
      damages: req.session.claim?.recoveryDamages,
      interest: req.session.claim?.recoveryInterest,
      previousPreCertificateCosts:
        req.session.claim?.recoveryPreCertificateCosts,
      backHref: this.navigationHelper.resolveBackHref(
        req,
        "/claim/inquest-outcome-recovery",
      ),
    });
  }

  processForm(
    req: TypedRequestBody<Partial<FinancialRecoveryCostsFormData>>,
    res: Response,
  ): void {
    const {
      body: {
        costs,
        damages,
        interest,
        "previous-pre-certificate-costs": previousPreCertificateCosts,
      },
    } = req;

    req.session.claim = {
      ...req.session.claim,
      recoveryCosts: costs,
      recoveryDamages: damages,
      recoveryInterest: interest,
      recoveryPreCertificateCosts: previousPreCertificateCosts,
    };

    res.redirect("/claim/paying-party");
  }
}
