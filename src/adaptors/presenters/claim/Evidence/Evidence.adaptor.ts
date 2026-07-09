import type { Request, Response } from "express";
import { ClaimJourneyStateUseCase } from "#src/use-cases/claim/ClaimJourneyState.useCase.js";
import { ClaimJourneyState } from "#src/use-cases/claim/models/ClaimJourneyState.js";
import { getClaimJourneyRedirectPath } from "#src/adaptors/presenters/claim/ClaimJourneyRedirectPath.js";

export class EvidenceAdaptor {
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
      evidenceCompleted: false,
    };

    res.render("claim/evidence", { csrfToken });
  }

  processForm(req: Request, res: Response): void {
    req.session.claim = {
      ...req.session.claim,
      evidenceCompleted: true,
    };
    res.redirect("/claim/check-your-answers");
  }
}
