import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  PayingPartyError,
  PayingPartyFormData,
  PayingPartyValidator,
} from "./PayingParty.validator.js";
import {
  CLAIM_CHECK_YOUR_ANSWERS_PATH,
  EMPTY_ARR_LENGTH,
  RECOVERY_COST_VALUE,
} from "#src/infrastructure/locales/constants.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";

export class PayingPartyAdaptor {
  formValidator: PayingPartyValidator;
  navigationHelper: ClaimNavigationHelper;

  constructor(
    formValidator: PayingPartyValidator,
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

    res.render("claim/paying-party", {
      csrfToken,
      payingParty: req.session.claim?.payingParty,
      backHref: this.navigationHelper.resolveBackHref(
        req,
        this.#previousStepHref(req),
      ),
    });
  }

  processForm(
    req: TypedRequestBody<Partial<PayingPartyFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      body: { "paying-party": payingParty },
    } = req;

    const errorSummaries: Partial<PayingPartyError> =
      this.formValidator.validatePayingParty(req.body);

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("claim/paying-party", {
        csrfToken,
        payingParty,
        errorSummaries,
      });
      return;
    }

    req.session.claim = {
      ...req.session.claim,
      payingParty,
    };

    this.navigationHelper.clearReturnToCheckYourAnswersFlag(req);
    res.redirect(CLAIM_CHECK_YOUR_ANSWERS_PATH);
  }

  #previousStepHref(req: Pick<Request, "session">): string {
    return req.session.claim?.recoveryCostMade === RECOVERY_COST_VALUE.YES
      ? "/claim/recovery-costs"
      : "/claim/pre-cert-costs";
  }
}
