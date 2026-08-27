import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  PreCertificateCostsError,
  PreCertificateCostsFormData,
  PreCertificateCostsValidator,
} from "./PreCertificateCosts.validator.js";
import {
  EMPTY_ARR_LENGTH,
  RECOVERY_COST_VALUE,
} from "#src/infrastructure/locales/constants.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";

const RECOVERY_COST_MADE_ANSWER_HREF = "/claim/inquest-outcome-recovery";

export class PreCertificateCostsAdaptor {
  formValidator: PreCertificateCostsValidator;
  navigationHelper: ClaimNavigationHelper;

  constructor(
    formValidator: PreCertificateCostsValidator,
    navigationHelper: ClaimNavigationHelper = new ClaimNavigationHelper(),
  ) {
    this.formValidator = formValidator;
    this.navigationHelper = navigationHelper;
  }

  renderForm(req: Request, res: Response): void {
    if (!this.#hasRecoveryCostNotBeenMade(req)) {
      res.redirect(RECOVERY_COST_MADE_ANSWER_HREF);
      return;
    }

    const {
      locals: { csrfToken },
    } = res;

    this.navigationHelper.captureCheckYourAnswersEntry(req);

    res.render("claim/pre-cert-costs", {
      csrfToken,
      preCertificateCosts: req.session.claim?.preCertificateCosts,
      backHref: this.navigationHelper.resolveBackHref(
        req,
        RECOVERY_COST_MADE_ANSWER_HREF,
      ),
    });
  }

  processForm(
    req: TypedRequestBody<Partial<PreCertificateCostsFormData>>,
    res: Response,
  ): void {
    if (!this.#hasRecoveryCostNotBeenMade(req)) {
      res.redirect(RECOVERY_COST_MADE_ANSWER_HREF);
      return;
    }

    const {
      locals: { csrfToken },
    } = res;
    const {
      body: { "pre-certificate-costs": preCertificateCosts },
    } = req;

    const errorSummaries: Partial<PreCertificateCostsError> =
      this.formValidator.validatePreCertificateCosts(req.body);

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("claim/pre-cert-costs", {
        csrfToken,
        preCertificateCosts,
        backHref: this.navigationHelper.resolveBackHref(
          req,
          RECOVERY_COST_MADE_ANSWER_HREF,
        ),
        errorSummaries,
      });
      return;
    }

    req.session.claim = {
      ...req.session.claim,
      preCertificateCosts,
    };

    res.redirect("/claim/paying-party");
  }

  #hasRecoveryCostNotBeenMade(req: Pick<Request, "session">): boolean {
    const recoveryCostMade = req.session.claim?.recoveryCostMade;
    return (
      recoveryCostMade === RECOVERY_COST_VALUE.NO ||
      recoveryCostMade === RECOVERY_COST_VALUE.DONT_KNOW
    );
  }
}
