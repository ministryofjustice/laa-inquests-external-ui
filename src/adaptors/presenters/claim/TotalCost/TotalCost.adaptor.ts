import type { Request, Response } from "express";
import { CLAIM_TYPE_VALUE } from "#src/infrastructure/locales/constants.js";

export class TotalCostAdaptor {
  renderForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    const claimType = req.session.claim?.type;
    const backHref =
      claimType === CLAIM_TYPE_VALUE.PAYMENT_ON_ACCOUNT
        ? "/claim/subtype"
        : "/claim/type";

    res.render("claim/total-cost", { csrfToken, backHref });
  }

  processForm(req: Request, res: Response): void {
    res.redirect("/claim/evidence");
  }
}
