import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  TotalClaimError,
  TotalClaimFormData,
} from "#src/adaptors/presenters/claim/TotalClaim/TotalClaim.validator.js";
import {
  CLAIM_TYPE_VALUE,
  EMPTY_ARR_LENGTH,
} from "#src/infrastructure/locales/constants.js";
import { TotalClaimValidator } from "#src/adaptors/presenters/claim/TotalClaim/TotalClaim.validator.js";

export class TotalClaimAdaptor {
  formValidator: TotalClaimValidator;

  constructor(formValidator: TotalClaimValidator = new TotalClaimValidator()) {
    this.formValidator = formValidator;
  }

  renderForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      session: { claim },
    } = req;

    if (req.query.from === "check-your-answers") {
      req.session.claim = { ...req.session.claim, returnToCheckYourAnswers: true };
    }

    const backHref = req.session.claim?.returnToCheckYourAnswers
      ? "/claim/check-your-answers"
      : this.#getBackHref(claim?.type);

    res.render("claim/total-cost", {
      csrfToken,
      backHref,
      zeroVatTotal: claim?.zeroVatTotal,
      netTotal: claim?.netTotal,
      grossTotal: claim?.grossTotal,
    });
  }

  processForm(
    req: TypedRequestBody<Partial<TotalClaimFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;

    const errorSummaries: Partial<TotalClaimError> =
      this.formValidator.validateTotalClaim(
        req.body,
        req.session.claim?.subtype,
      );

    const zeroVatTotal = this.#normaliseForSession(req.body["zero-vat-total"]);
    const netTotal = this.#normaliseForSession(req.body["net-total"]);
    const grossTotal = this.#normaliseForSession(req.body["gross-total"]);

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      const backHref = req.session.claim?.returnToCheckYourAnswers
        ? "/claim/check-your-answers"
        : this.#getBackHref(req.session.claim?.type);
      res.render("claim/total-cost", {
        csrfToken,
        backHref,
        zeroVatTotal,
        netTotal,
        grossTotal,
        errorSummaries,
      });
      return;
    }

    const returnToCheckYourAnswers = req.session.claim?.returnToCheckYourAnswers;
    req.session.claim = {
      ...req.session.claim,
      zeroVatTotal,
      netTotal,
      grossTotal,
      returnToCheckYourAnswers: undefined,
    };

    res.redirect(returnToCheckYourAnswers ? "/claim/check-your-answers" : "/claim/evidence");
  }

  #getBackHref(claimType: string | undefined): string {
    return claimType === CLAIM_TYPE_VALUE.PAYMENT_ON_ACCOUNT
      ? "/claim/subtype"
      : "/claim/type";
  }

  #normaliseForSession(inputValue: string | undefined): string | undefined {
    if (typeof inputValue !== "string") {
      return undefined;
    }

    const trimmedInput = inputValue.trim();
    return trimmedInput === "" ? undefined : trimmedInput;
  }
}
