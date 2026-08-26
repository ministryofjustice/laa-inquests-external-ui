import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  FundingPostInquestError,
  FundingPostInquestFormData,
  FundingPostInquestValidator,
} from "./FundingPostInquest.validator.js";
import {
  CLAIM_CHECK_YOUR_ANSWERS_PATH,
  EMPTY_ARR_LENGTH,
  FUNDING_POST_INQUEST_OPTIONS,
  FUNDING_POST_INQUEST_VALUE,
} from "#src/infrastructure/locales/constants.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";

export class FundingPostInquestAdaptor {
  formValidator: FundingPostInquestValidator;
  navigationHelper: ClaimNavigationHelper;

  constructor(
    formValidator: FundingPostInquestValidator,
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

    res.render("claim/funding-post-inquest", {
      csrfToken,
      fundingPostInquest: req.session.claim?.fundingPostInquest,
      fundingOptions: FUNDING_POST_INQUEST_OPTIONS,
      backHref: this.navigationHelper.resolveBackHref(
        req,
        "/claim/inquest-outcome",
      ),
    });
  }

  processForm(
    req: TypedRequestBody<Partial<FundingPostInquestFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      body: { "funding-post-inquest": fundingPostInquest },
    } = req;

    const errorSummaries: Partial<FundingPostInquestError> =
      this.formValidator.validateFunding(req.body);

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("claim/funding-post-inquest", {
        csrfToken,
        fundingPostInquest,
        fundingOptions: FUNDING_POST_INQUEST_OPTIONS,
        errorSummaries,
      });
      return;
    }

    req.session.claim = {
      ...req.session.claim,
      fundingPostInquest,
    };

    if (fundingPostInquest === FUNDING_POST_INQUEST_VALUE.NO) {
      this.navigationHelper.clearReturnToCheckYourAnswersFlag(req);
      res.redirect(CLAIM_CHECK_YOUR_ANSWERS_PATH);
    } else {
      res.redirect("/claim/inquest-outcome-recovery");
    }
  }
}
