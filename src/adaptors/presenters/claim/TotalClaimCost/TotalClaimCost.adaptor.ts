import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  TotalClaimCostError,
  TotalClaimCostFormData,
} from "#src/adaptors/presenters/claim/TotalClaimCost/TotalClaimCost.validator.js";
import {
  CLAIM_TYPE_VALUE,
  EMPTY_ARR_LENGTH,
  NIL_BILL_GROSS_TOTAL,
} from "#src/infrastructure/locales/constants.js";
import { TotalClaimCostValidator } from "#src/adaptors/presenters/claim/TotalClaimCost/TotalClaimCost.validator.js";

export class TotalClaimCostAdaptor {
  formValidator: TotalClaimCostValidator;

  constructor(
    formValidator: TotalClaimCostValidator = new TotalClaimCostValidator(),
  ) {
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
      req.session.claim = {
        ...req.session.claim,
        returnToCheckYourAnswers: true,
      };
    }

    res.render("claim/total-cost", {
      csrfToken,
      isFinalBill: claim?.type === CLAIM_TYPE_VALUE.FINAL_BILL,
      backHref:
        req.session.claim?.returnToCheckYourAnswers === true
          ? "/claim/check-your-answers"
          : this.#getBackHref(claim?.type),
      zeroVatTotal: claim?.zeroVatTotal,
      netTotal: claim?.netTotal,
      grossTotal: claim?.grossTotal,
    });
  }

  processForm(
    req: TypedRequestBody<Partial<TotalClaimCostFormData>>,
    res: Response,
  ): void {
    if (req.session.claim?.type === CLAIM_TYPE_VALUE.FINAL_BILL) {
      this.#processFinalBill(req, res);
    } else {
      const {
        locals: { csrfToken },
      } = res;

      const errorSummaries: Partial<TotalClaimCostError> =
        this.formValidator.validateTotalClaimCost(
          req.body,
          req.session.claim?.subtype,
        );

      const zeroVatTotal = this.#normaliseForSession(
        req.body["zero-vat-total"],
      );
      const netTotal = this.#normaliseForSession(req.body["net-total"]);
      const grossTotal = this.#normaliseForSession(req.body["gross-total"]);

      if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
        res.render("claim/total-cost", {
          csrfToken,
          backHref: this.#getBackHref(req.session.claim?.type),
          zeroVatTotal,
          netTotal,
          grossTotal,
          errorSummaries,
        });
      } else {
        const returnToCheckYourAnswers =
          req.session.claim?.returnToCheckYourAnswers;
        req.session.claim = {
          ...req.session.claim,
          zeroVatTotal,
          netTotal,
          grossTotal,
          returnToCheckYourAnswers: undefined,
        };

        res.redirect(
          returnToCheckYourAnswers === true
            ? "/claim/check-your-answers"
            : "/claim/evidence",
        );
      }
    }
  }

  #processFinalBill(
    req: TypedRequestBody<Partial<TotalClaimCostFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;

    const errorSummaries: Partial<TotalClaimCostError> =
      this.formValidator.validateFinalBillTotal(req.body);

    const grossTotal = this.#normaliseForSession(req.body["gross-total"]);

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("claim/total-cost", {
        csrfToken,
        isFinalBill: true,
        backHref: this.#getBackHref(req.session.claim?.type),
        grossTotal,
        errorSummaries,
      });
      return;
    }

    const isNilBill = Number(grossTotal) === NIL_BILL_GROSS_TOTAL;
    req.session.claim = {
      ...req.session.claim,
      grossTotal,
      subtype: isNilBill ? CLAIM_TYPE_VALUE.NIL_BILL : undefined,
    };

    if (isNilBill) {
      res.redirect("/claim/inquest-outcome");
    } else {
      res.redirect("/claim/final-bill-template");
    }
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
