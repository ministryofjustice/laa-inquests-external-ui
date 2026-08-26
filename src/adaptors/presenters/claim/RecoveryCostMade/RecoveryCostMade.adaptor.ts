import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  RecoveryCostMadeError,
  RecoveryCostMadeFormData,
  RecoveryCostMadeValidator,
} from "./RecoveryCostMade.validator.js";
import {
  EMPTY_ARR_LENGTH,
  RECOVERY_COST_OPTIONS,
} from "#src/infrastructure/locales/constants.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";

export class RecoveryCostMadeAdaptor {
  formValidator: RecoveryCostMadeValidator;
  navigationHelper: ClaimNavigationHelper;

  constructor(
    formValidator: RecoveryCostMadeValidator,
    navigationHelper: ClaimNavigationHelper = new ClaimNavigationHelper(),
  ) {
    this.formValidator = formValidator;
    this.navigationHelper = navigationHelper;
  }

  renderForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    this.navigationHelper.captureCheckYourAnswersEntry(req);

    res.render("claim/inquest-outcome-recovery", {
      csrfToken,
      recoveryCostMade: req.session.claim?.recoveryCostMade,
      recoveryOptions: RECOVERY_COST_OPTIONS,
      backHref: this.navigationHelper.resolveBackHref(
        req,
        "/claim/funding-post-inquest",
      ),
    });
  }

  processForm(
    req: TypedRequestBody<Partial<RecoveryCostMadeFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      body: { "recovery-cost-made": recoveryCostMade },
    } = req;

    const errorSummaries: Partial<RecoveryCostMadeError> =
      this.formValidator.validateRecoveryCostMade(req.body);

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("claim/inquest-outcome-recovery", {
        csrfToken,
        recoveryCostMade,
        recoveryOptions: RECOVERY_COST_OPTIONS,
        errorSummaries,
      });
      return;
    }

    req.session.claim = {
      ...req.session.claim,
      recoveryCostMade,
    };

    res.redirect("/claim/recovery-costs");
  }
}
