import type { Request, Response } from "express";

export class EvidenceAdaptor {
  renderForm(req: Request, res: Response): void {
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
