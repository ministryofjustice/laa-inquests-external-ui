import type { Request, Response } from "express";

export class EvidenceAdaptor {
  renderForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("claim/evidence", { csrfToken });
  }

  processForm(req: Request, res: Response): void {
    res.redirect("/claim/check-your-answers");
  }
}
