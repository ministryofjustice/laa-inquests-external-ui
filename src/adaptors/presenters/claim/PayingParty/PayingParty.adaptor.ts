import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import { CLAIM_CHECK_YOUR_ANSWERS_PATH } from "#src/infrastructure/locales/constants.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";

export interface PayingPartyFormData {
  "paying-party"?: string;
}

export class PayingPartyAdaptor {
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

    res.render("claim/paying-party", {
      csrfToken,
      payingParty: req.session.claim?.payingParty,
      backHref: this.navigationHelper.resolveBackHref(
        req,
        "/claim/recovery-costs",
      ),
    });
  }

  processForm(
    req: TypedRequestBody<Partial<PayingPartyFormData>>,
    res: Response,
  ): void {
    const {
      body: { "paying-party": payingParty },
    } = req;

    req.session.claim = {
      ...req.session.claim,
      payingParty,
    };

    this.navigationHelper.clearReturnToCheckYourAnswersFlag(req);
    res.redirect(CLAIM_CHECK_YOUR_ANSWERS_PATH);
  }
}
