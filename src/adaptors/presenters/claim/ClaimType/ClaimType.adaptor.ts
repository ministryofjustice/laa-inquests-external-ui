import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  ClaimSubtypeError,
  ClaimSubtypeFormData,
  ClaimTypeError,
  ClaimTypeFormData,
  ClaimTypeValidator,
} from "./ClaimType.validator.js";
import {
  CLAIM_TYPE_VALUE,
  EMPTY_ARR_LENGTH,
} from "#src/infrastructure/locales/constants.js";

export class ClaimTypeAdaptor {
  formValidator: ClaimTypeValidator;

  constructor(formValidator: ClaimTypeValidator) {
    this.formValidator = formValidator;
  }

  renderForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("claim/claim-type", {
      csrfToken,
      claimType: req.session.claimType,
    });
  }

  processForm(
    req: TypedRequestBody<Partial<ClaimTypeFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      body: { "claim-type": claimType },
    } = req;

    const errorSummaries: Partial<ClaimTypeError> =
      this.formValidator.validateClaimType(req.body);

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("claim/claim-type", {
        csrfToken,
        claimType,
        errorSummaries,
      });
    } else {
      req.session.claimType = claimType;
      res.redirect(
        claimType === CLAIM_TYPE_VALUE.PAYMENT_ON_ACCOUNT
          ? "/claim/subtype"
          : "/claim/total-cost",
      );
    }
  }

  renderSubtypeForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("claim/claim-subtype", {
      csrfToken,
      claimSubtype: req.session.claimSubtype,
    });
  }

  processSubtypeForm(
    req: TypedRequestBody<Partial<ClaimSubtypeFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      body: { "claim-subtype": claimSubtype },
    } = req;

    const errorSummaries: Partial<ClaimSubtypeError> =
      this.formValidator.validateClaimSubtype(req.body);

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("claim/claim-subtype", {
        csrfToken,
        claimSubtype,
        errorSummaries,
      });
    } else {
      req.session.claimSubtype = claimSubtype;
      res.redirect("/claim/total-cost");
    }
  }
}
