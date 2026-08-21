import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  CounselNumberError,
  CounselNumberFormData,
  CounselNumberValidator,
} from "./CounselNumber.validator.js";
import {
  COUNSEL_NUMBER_ZERO,
  EMPTY_ARR_LENGTH,
} from "#src/infrastructure/locales/constants.js";

export class CounselNumberAdaptor {
  formValidator: CounselNumberValidator;

  constructor(formValidator: CounselNumberValidator) {
    this.formValidator = formValidator;
  }

  renderForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    if (req.query.from === "check-your-answers") {
      req.session.claim = {
        ...req.session.claim,
        returnToCheckYourAnswers: true,
      };
    }

    res.render("claim/counsel-number", {
      csrfToken,
      counselNumber: req.session.claim?.counselNumber,
      backHref:
        req.session.claim?.returnToCheckYourAnswers === true
          ? "/claim/check-your-answers"
          : "/claim/evidence",
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
        errorSummaries,
      });
    } else {
      const returnToCheckYourAnswers =
        req.session.claim?.returnToCheckYourAnswers;
      req.session.claim = {
        ...req.session.claim,
        counselNumber,
        returnToCheckYourAnswers: undefined,
      };
      if (returnToCheckYourAnswers === true) {
        res.redirect("/claim/check-your-answers");
      } else if (counselNumber === COUNSEL_NUMBER_ZERO) {
        res.redirect("/claim/check-your-answers");
      } else {
        res.redirect("/claim/counsel-pay-confirmation");
      }
    }
  }
}
