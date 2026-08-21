import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  CounselPayConfirmationError,
  CounselPayConfirmationFormData,
  CounselPayConfirmationValidator,
} from "./CounselPayConfirmation.validator.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";

export class CounselPayConfirmationAdaptor {
  formValidator: CounselPayConfirmationValidator;

  constructor(formValidator: CounselPayConfirmationValidator) {
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

    res.render("claim/counsel-pay-confirmation", {
      csrfToken,
      counselBillsPaid: req.session.claim?.counselBillsPaid === true,
      backHref:
        req.session.claim?.returnToCheckYourAnswers === true
          ? "/claim/check-your-answers"
          : "/claim/counsel-number",
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
        returnToCheckYourAnswers: undefined,
      };
      res.redirect("/claim/check-your-answers");
    }
  }
}
