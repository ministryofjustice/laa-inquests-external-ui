import type { Request, Response } from "express";

export class TotalCostAdaptor {
  renderForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("claim/total-cost", { csrfToken });
  }

  processForm(req: Request, res: Response): void {
    res.redirect("/claim/evidence");
  }
}
