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
import { ClaimJourneyStateUseCase } from "#src/use-cases/claim/ClaimJourneyState.useCase.js";
import { ClaimJourneyState } from "#src/use-cases/claim/models/ClaimJourneyState.js";
import { getClaimJourneyRedirectPath } from "#src/adaptors/presenters/claim/ClaimJourneyRedirectPath.js";

export class ClaimTypeAdaptor {
  formValidator: ClaimTypeValidator;
  claimJourneyStateUseCase: ClaimJourneyStateUseCase;

  constructor(
    formValidator: ClaimTypeValidator,
    claimJourneyStateUseCase: ClaimJourneyStateUseCase = new ClaimJourneyStateUseCase(),
  ) {
    this.formValidator = formValidator;
    this.claimJourneyStateUseCase = claimJourneyStateUseCase;
  }

  renderForm(req: Request, res: Response): void {
    const journeyState = this.claimJourneyStateUseCase.execute(
      req.session.claim,
    );
    const redirectPath = getClaimJourneyRedirectPath(journeyState, [
      ClaimJourneyState.CLAIM_TYPE_INCOMPLETE,
      ClaimJourneyState.CLAIM_SUBTYPE_INCOMPLETE,
      ClaimJourneyState.TOTAL_COST_INCOMPLETE,
      ClaimJourneyState.EVIDENCE_INCOMPLETE,
      ClaimJourneyState.COMPLETE,
    ]);

    if (redirectPath !== null) {
      res.redirect(redirectPath);
      return;
    }

    const {
      locals: { csrfToken },
    } = res;

    req.session.claim = {
      ...req.session.claim,
      typeCompleted: false,
      subtypeCompleted: false,
      totalCostCompleted: false,
      evidenceCompleted: false,
    };

    res.render("claim/claim-type", {
      csrfToken,
      claimType: req.session.claim.type,
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
      req.session.claim = {
        ...req.session.claim,
        type: claimType,
        typeCompleted: true,
        subtype: isPoa ? req.session.claim?.subtype : undefined,
        subtypeCompleted: !isPoa,
        totalCostCompleted: false,
        evidenceCompleted: false,
      };
      res.redirect(isPoa ? "/claim/subtype" : "/claim/total-cost");
    }
  }

  renderSubtypeForm(req: Request, res: Response): void {
    const journeyState = this.claimJourneyStateUseCase.execute(
      req.session.claim,
    );
    const redirectPath = getClaimJourneyRedirectPath(journeyState, [
      ClaimJourneyState.CLAIM_SUBTYPE_INCOMPLETE,
      ClaimJourneyState.TOTAL_COST_INCOMPLETE,
      ClaimJourneyState.EVIDENCE_INCOMPLETE,
      ClaimJourneyState.COMPLETE,
    ]);

    if (redirectPath !== null) {
      res.redirect(redirectPath);
      return;
    }

    const {
      locals: { csrfToken },
    } = res;

    req.session.claim = {
      ...req.session.claim,
      subtypeCompleted: false,
      totalCostCompleted: false,
      evidenceCompleted: false,
    };

    res.render("claim/claim-subtype", {
      csrfToken,
      claimSubtype: req.session.claim.subtype,
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
      req.session.claim = {
        ...req.session.claim,
        subtype: claimSubtype,
        subtypeCompleted: true,
        totalCostCompleted: false,
        evidenceCompleted: false,
      };
      res.redirect("/claim/total-cost");
    }
  }
}
