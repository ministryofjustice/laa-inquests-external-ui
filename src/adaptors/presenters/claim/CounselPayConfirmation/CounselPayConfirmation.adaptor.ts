import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  CounselPayConfirmationError,
  CounselPayConfirmationFormData,
  CounselPayConfirmationValidator,
} from "./CounselPayConfirmation.validator.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";
import { CLAIM_PATHS } from "#src/infrastructure/express/routes/paths.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";
import { markClaimStepComplete } from "#src/adaptors/presenters/utils/journeyStepHelper.js";

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
      if (this.navigationHelper.isReturningToCheckYourAnswers(req)) {
        markClaimStepComplete(
          req,
          "/claim/counsel-pay-confirmation",
          CLAIM_PATHS.CHECK_YOUR_ANSWERS,
        );
        this.navigationHelper.clearReturnToCheckYourAnswersFlag(req);
        res.redirect(CLAIM_PATHS.CHECK_YOUR_ANSWERS);
      } else {
        markClaimStepComplete(
          req,
          "/claim/counsel-pay-confirmation",
          "/claim/end-date",
        );
        res.redirect("/claim/end-date");
      }
    }
  }
}
