import type { Request, Response } from "express";
import { CLAIM_TYPE_VALUE } from "#src/infrastructure/locales/constants.js";

export class TotalCostAdaptor {
  renderForm(req: Request, res: Response): void {
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
