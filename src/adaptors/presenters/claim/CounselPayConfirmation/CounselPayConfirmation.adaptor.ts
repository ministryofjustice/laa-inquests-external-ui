import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  CounselPayConfirmationError,
  CounselPayConfirmationFormData,
  CounselPayConfirmationValidator,
} from "./CounselPayConfirmation.validator.js";
import {
  CLAIM_CHECK_YOUR_ANSWERS_PATH,
  EMPTY_ARR_LENGTH,
} from "#src/infrastructure/locales/constants.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";

export class CounselPayConfirmationAdaptor {
  formValidator: CounselPayConfirmationValidator;
  navigationHelper: ClaimNavigationHelper;

  constructor(
    formValidator: CounselPayConfirmationValidator,
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

    res.render("claim/counsel-pay-confirmation", {
      csrfToken,
      counselBillsPaid: req.session.claim?.counselBillsPaid === true,
      backHref: this.navigationHelper.resolveBackHref(
        req,
        "/claim/counsel-number",
      ),
    });
  }

  processForm(
    req: TypedRequestBody<Partial<CounselPayConfirmationFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;

    const errorSummaries: Partial<CounselPayConfirmationError> =
      this.formValidator.validateConfirmation(req.body);

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("claim/counsel-pay-confirmation", {
        csrfToken,
        counselBillsPaid: false,
        errorSummaries,
      });
    } else {
      req.session.claim = {
        ...req.session.claim,
        counselBillsPaid: true,
      };
      this.navigationHelper.clearReturnToCheckYourAnswersFlag(req);
      res.redirect(CLAIM_CHECK_YOUR_ANSWERS_PATH);
    }
  }
}
