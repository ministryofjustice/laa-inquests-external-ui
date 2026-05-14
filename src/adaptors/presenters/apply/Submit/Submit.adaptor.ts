import type { Request, Response } from "express";

export class SubmitAdaptor {
  renderClientDeclarationForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/submit/client-declaration", {
      csrfToken,
      clientDetails: {
        firstName: req.session.clientFirstName ?? "",
        lastName: req.session.clientLastName ?? "",
      },
    });
  }

  processClientDeclarationForm(req: Request, res: Response): void {
    res.redirect("/apply/confirmation/success");
  }
}
