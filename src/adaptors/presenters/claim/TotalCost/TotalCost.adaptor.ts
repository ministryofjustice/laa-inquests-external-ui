import type { Request, Response } from "express";
import { CLAIM_TYPE_VALUE } from "#src/infrastructure/locales/constants.js";
import { ClaimJourneyStateUseCase } from "#src/use-cases/claim/ClaimJourneyState.useCase.js";
import { ClaimJourneyState } from "#src/use-cases/claim/models/ClaimJourneyState.js";
import { getClaimJourneyRedirectPath } from "#src/adaptors/presenters/claim/ClaimJourneyRedirectPath.js";

export class TotalCostAdaptor {
  claimJourneyStateUseCase: ClaimJourneyStateUseCase;

  constructor(
    claimJourneyStateUseCase: ClaimJourneyStateUseCase = new ClaimJourneyStateUseCase(),
  ) {
    this.claimJourneyStateUseCase = claimJourneyStateUseCase;
  }

  renderForm(req: Request, res: Response): void {
    const journeyState = this.claimJourneyStateUseCase.execute(
      req.session.claim,
    );
    const redirectPath = getClaimJourneyRedirectPath(journeyState, [
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
      totalCostCompleted: false,
      evidenceCompleted: false,
    };

    const {
      session: {
        claim: { type: claimType },
      },
    } = req;
    const backHref =
      claimType === CLAIM_TYPE_VALUE.PAYMENT_ON_ACCOUNT
        ? "/claim/subtype"
        : "/claim/type";

    res.render("claim/total-cost", { csrfToken, backHref });
  }

  processForm(req: Request, res: Response): void {
    req.session.claim = {
      ...req.session.claim,
      totalCostCompleted: true,
      evidenceCompleted: false,
    };
    res.redirect("/claim/evidence");
  }
}
