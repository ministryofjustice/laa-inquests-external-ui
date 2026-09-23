import type { Request, Response } from "express";

export class CannotClaimAdaptor {
  renderPage(req: Request, res: Response): void {
    const {
      session: { claim },
    } = req;

    if (claim?.claimBlocked !== true) {
      res.redirect("/claim");
      return;
    }

    res.render("claim/cannot-claim", {
      csrfToken: res.locals.csrfToken,
      caseReference: claim.caseReference ?? "",
      variant: "entry",
    });
  }
}
