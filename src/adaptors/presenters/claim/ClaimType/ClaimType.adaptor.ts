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
import { CLAIM_PATHS } from "#src/infrastructure/express/routes/paths.js";
import { ClaimNavigationHelper } from "#src/adaptors/presenters/claim/ClaimNavigation.helper.js";
import { completeStepAndRedirect } from "../../utils/journeyStepHelper.js";
import { JOURNEY_TYPES } from "#src/infrastructure/config/journeySequences.js";

export class ClaimTypeAdaptor {
  formValidator: ClaimTypeValidator;
  navigationHelper: ClaimNavigationHelper;

  constructor(
    formValidator: ClaimTypeValidator,
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

    res.render("claim/claim-type", {
      csrfToken,
      claimType: req.session.claim?.type,
      backHref: this.navigationHelper.resolveBackHref(req, "/claim/results"),
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
      const isPoa = claimType === CLAIM_TYPE_VALUE.PAYMENT_ON_ACCOUNT;
      const isFinalBill = claimType === CLAIM_TYPE_VALUE.FINAL_BILL;
      if (
        req.session.claim?.type !== undefined &&
        req.session.claim.type !== claimType
      ) {
        this.navigationHelper.clearReturnToCheckYourAnswersFlag(req);
      }
      const returnToCheckYourAnswers =
        this.navigationHelper.isReturningToCheckYourAnswers(req);
      req.session.claim = {
        ...req.session.claim,
        type: claimType,
        subtype: isPoa ? req.session.claim?.subtype : undefined,
      };
      if (isPoa) {
        completeStepAndRedirect(
          req as Request,
          res,
          "/claim/subtype",
          JOURNEY_TYPES.CLAIM,
        );
      } else if (isFinalBill) {
        completeStepAndRedirect(
          req as Request,
          res,
          "/claim/total-cost",
          JOURNEY_TYPES.CLAIM,
        );
      } else if (returnToCheckYourAnswers) {
        this.navigationHelper.clearReturnToCheckYourAnswersFlag(req);
        completeStepAndRedirect(
          req as Request,
          res,
          CLAIM_PATHS.CHECK_YOUR_ANSWERS,
          JOURNEY_TYPES.CLAIM,
        );
      } else {
        completeStepAndRedirect(
          req as Request,
          res,
          "/claim/total-cost",
          JOURNEY_TYPES.CLAIM,
        );
      }
    }
  }

  renderSubtypeForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    this.navigationHelper.captureCheckYourAnswersEntry(req);

    res.render("claim/claim-subtype", {
      csrfToken,
      claimSubtype: req.session.claim?.subtype,
      backHref: this.navigationHelper.resolveBackHref(req, "/claim/type"),
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
      const returnToCheckYourAnswers =
        this.navigationHelper.isReturningToCheckYourAnswers(req);
      req.session.claim = {
        ...req.session.claim,
        subtype: claimSubtype,
      };
      if (returnToCheckYourAnswers) {
        this.navigationHelper.clearReturnToCheckYourAnswersFlag(req);
        completeStepAndRedirect(
          req as Request,
          res,
          CLAIM_PATHS.CHECK_YOUR_ANSWERS,
          JOURNEY_TYPES.CLAIM,
        );
      } else {
        completeStepAndRedirect(
          req as Request,
          res,
          "/claim/total-cost",
          JOURNEY_TYPES.CLAIM,
        );
      }
    }
  }
}
