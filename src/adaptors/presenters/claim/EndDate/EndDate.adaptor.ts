import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import {
  COUNSEL_NUMBER_ZERO,
  EMPTY_ARR_LENGTH,
} from "#src/infrastructure/locales/constants.js";
import type {
  EndDateFormData,
  EndDateValidator,
} from "#src/adaptors/presenters/claim/EndDate/EndDate.validator.js";

export class EndDateAdaptor {
  readonly #formValidator: EndDateValidator;

  constructor(formValidator: EndDateValidator) {
    this.#formValidator = formValidator;
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

    const backHref = this.#resolveBackHref(req);

    res.render("claim/end-date", {
      csrfToken,
      backHref,
      endDate: {
        day: req.session.claim?.endDateDay,
        month: req.session.claim?.endDateMonth,
        year: req.session.claim?.endDateYear,
      },
    });
  }

  processForm(
    req: TypedRequestBody<Partial<EndDateFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;

    const {
      body: {
        "end-date-day": day,
        "end-date-month": month,
        "end-date-year": year,
      },
    } = req;

    const errorSummaries = this.#formValidator.validateEndDate(req.body);

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      const backHref = this.#resolveBackHref(req);

      res.render("claim/end-date", {
        csrfToken,
        backHref,
        errorSummaries,
        endDate: { day, month, year },
      });
      return;
    }

    req.session.claim = {
      ...req.session.claim,
      endDateDay: day,
      endDateMonth: month,
      endDateYear: year,
    };

    if (req.session.claim.returnToCheckYourAnswers === true) {
      res.redirect("/claim/check-your-answers");
    } else {
      res.redirect("/claim/inquest-outcome");
    }
  }

  #resolveBackHref(req: Pick<Request, "session">): string {
    if (req.session.claim?.returnToCheckYourAnswers === true) {
      return "/claim/check-your-answers";
    }
    if (req.session.claim?.counselNumber === COUNSEL_NUMBER_ZERO) {
      return "/claim/counsel-number";
    }
    return "/claim/counsel-pay-confirmation";
  }
}
