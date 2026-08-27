import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  FinancialRecoveryCostsError,
  FinancialRecoveryCostsFormData,
} from "#src/adaptors/presenters/claim/FinancialRecoveryCosts/FinancialRecoveryCosts.validator.js";
import { FinancialRecoveryCostsValidator } from "#src/adaptors/presenters/claim/FinancialRecoveryCosts/FinancialRecoveryCosts.validator.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";
import {
  EMPTY_ARR_LENGTH,
  RECOVERY_COST_VALUE,
} from "#src/infrastructure/locales/constants.js";

const RECOVERY_COST_MADE_ANSWER_HREF = "/claim/inquest-outcome-recovery";

export class FinancialRecoveryCostsAdaptor {
  formValidator: FinancialRecoveryCostsValidator;
  navigationHelper: ClaimNavigationHelper;

  constructor(
    formValidator: FinancialRecoveryCostsValidator = new FinancialRecoveryCostsValidator(),
    navigationHelper: ClaimNavigationHelper = new ClaimNavigationHelper(),
  ) {
    this.formValidator = formValidator;
    this.navigationHelper = navigationHelper;
  }

  renderForm(req: Request, res: Response): void {
    if (!this.#hasAnsweredRecoveryCostMade(req)) {
      res.redirect(RECOVERY_COST_MADE_ANSWER_HREF);
      return;
    }

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
    if (!this.#hasAnsweredRecoveryCostMade(req)) {
      res.redirect(RECOVERY_COST_MADE_ANSWER_HREF);
      return;
    }

    const {
      locals: { csrfToken },
    } = res;
    const {
      body: {
        costs,
        damages,
        interest,
        "previous-pre-certificate-costs": previousPreCertificateCosts,
      },
    } = req;

    const errorSummaries: Partial<FinancialRecoveryCostsError> =
      this.formValidator.validateFinancialRecoveryCosts(
        req.body,
        req.session.claim?.recoveryCostMade,
      );

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("claim/recovery-costs", {
        csrfToken,
        costs,
        damages,
        interest,
        previousPreCertificateCosts,
        backHref: this.navigationHelper.resolveBackHref(
          req,
          "/claim/inquest-outcome-recovery",
        ),
        errorSummaries,
      });
      return;
    }

    req.session.claim = {
      ...req.session.claim,
      recoveryCosts: costs,
      recoveryDamages: damages,
      recoveryInterest: interest,
      recoveryPreCertificateCosts: previousPreCertificateCosts,
    };

    res.redirect("/claim/paying-party");
  }

  #hasAnsweredRecoveryCostMade(req: Pick<Request, "session">): boolean {
    return Object.values(RECOVERY_COST_VALUE).includes(
      req.session.claim
        ?.recoveryCostMade as (typeof RECOVERY_COST_VALUE)[keyof typeof RECOVERY_COST_VALUE],
    );
  }
}
