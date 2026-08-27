import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  CounselNumberError,
  CounselNumberFormData,
  CounselNumberValidator,
} from "./CounselNumber.validator.js";
import {
  CLAIM_CHECK_YOUR_ANSWERS_PATH,
  COUNSEL_NUMBER_OPTIONS,
  COUNSEL_NUMBER_ZERO,
  EMPTY_ARR_LENGTH,
} from "#src/infrastructure/locales/constants.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";

export class CounselNumberAdaptor {
  formValidator: CounselNumberValidator;
  navigationHelper: ClaimNavigationHelper;

  constructor(
    formValidator: CounselNumberValidator,
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

    res.render("claim/counsel-number", {
      csrfToken,
      counselNumber: req.session.claim?.counselNumber,
      counselOptions: COUNSEL_NUMBER_OPTIONS,
      backHref: this.navigationHelper.resolveBackHref(req, "/claim/evidence"),
    });
  }

  processForm(
    req: TypedRequestBody<Partial<CounselNumberFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      body: { "counsel-number": counselNumber },
    } = req;

    const errorSummaries: Partial<CounselNumberError> =
      this.formValidator.validateCounselNumber(req.body);

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("claim/counsel-number", {
        csrfToken,
        counselNumber,
        counselOptions: COUNSEL_NUMBER_OPTIONS,
        errorSummaries,
      });
    } else {
      const returnToCheckYourAnswers =
        this.navigationHelper.isReturningToCheckYourAnswers(req);
      const counselBillsPaid = req.session.claim?.counselBillsPaid;

      if (counselNumber === COUNSEL_NUMBER_ZERO) {
        req.session.claim = {
          ...req.session.claim,
          counselNumber,
          counselBillsPaid: undefined,
        };
        if (returnToCheckYourAnswers) {
          this.navigationHelper.clearReturnToCheckYourAnswersFlag(req);
          res.redirect(CLAIM_CHECK_YOUR_ANSWERS_PATH);
        } else {
          res.redirect("/claim/end-date");
        }
      } else if (returnToCheckYourAnswers && counselBillsPaid === true) {
        req.session.claim = {
          ...req.session.claim,
          counselNumber,
        };
        this.navigationHelper.clearReturnToCheckYourAnswersFlag(req);
        res.redirect(CLAIM_CHECK_YOUR_ANSWERS_PATH);
      } else {
        req.session.claim = {
          ...req.session.claim,
          counselNumber,
        };
        res.redirect("/claim/counsel-pay-confirmation");
      }
    }
  }
}
