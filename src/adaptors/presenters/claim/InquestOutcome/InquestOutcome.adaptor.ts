import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import {
  EMPTY_ARR_LENGTH,
  INQUEST_OUTCOME_OPTIONS,
} from "#src/infrastructure/locales/constants.js";
import type {
  InquestOutcomeError,
  InquestOutcomeFormData,
  InquestOutcomeValidator,
} from "./InquestOutcome.validator.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";

export class InquestOutcomeAdaptor {
  formValidator: InquestOutcomeValidator;
  navigationHelper: ClaimNavigationHelper;

  constructor(
    formValidator: InquestOutcomeValidator,
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

    const selectedOutcomes = req.session.claim?.inquestOutcomes ?? [];

    res.render("claim/inquest-outcome", {
      csrfToken,
      backHref: this.navigationHelper.resolveBackHref(req, "/claim/end-date"),
      outcomeOptions: INQUEST_OUTCOME_OPTIONS.map((option) => ({
        value: option.value,
        text: option.text,
        hint: { text: option.hint },
        checked: selectedOutcomes.includes(option.value),
      })),
    });
  }

  processForm(
    req: TypedRequestBody<Partial<InquestOutcomeFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;

    const errorSummaries: Partial<InquestOutcomeError> =
      this.formValidator.validateOutcome(req.body);

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("claim/inquest-outcome", {
        csrfToken,
        backHref: this.navigationHelper.resolveBackHref(req, "/claim/end-date"),
        outcomeOptions: INQUEST_OUTCOME_OPTIONS.map((option) => ({
          value: option.value,
          text: option.text,
          hint: { text: option.hint },
          checked: false,
        })),
        errorSummaries,
      });
      return;
    }

    const {
      body: { "inquest-outcome": selection },
    } = req;
    const inquestOutcomes = Array.isArray(selection) ? selection : [selection!];

    req.session.claim = {
      ...req.session.claim,
      inquestOutcomes,
    };

    if (this.navigationHelper.isReturningToCheckYourAnswers(req)) {
      this.navigationHelper.clearReturnToCheckYourAnswersFlag(req);
      res.redirect("/claim/check-your-answers");
    } else {
      res.redirect("/claim/funding-post-inquest");
    }
  }
}
