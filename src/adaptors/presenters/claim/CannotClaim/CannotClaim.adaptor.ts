import type { Request, Response } from "express";
import { completeStepAndRedirect } from "../../utils/journeyStepHelper.js";
import { JOURNEY_TYPES } from "#src/infrastructure/config/journeySequences.js";

export class CannotClaimAdaptor {
  renderPage(req: Request, res: Response): void {
    const {
      session: { claim },
    } = req;

    if (claim?.claimBlocked === true) {
      res.render("claim/cannot-claim", {
        csrfToken: res.locals.csrfToken,
        caseReference: claim.caseReference ?? "",
        variant: "entry",
      });
    } else {
      completeStepAndRedirect(req, res, "/claim", JOURNEY_TYPES.CLAIM);
    }
  }
}
