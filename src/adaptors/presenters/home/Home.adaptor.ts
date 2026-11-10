import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type { WhatDoYouWantToDoFormData } from "../apply/models/form.types.js";

export class HomeAdaptor {
  renderHome(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("main/index", { csrfToken });
  }

  processForm(
    req: TypedRequestBody<Partial<WhatDoYouWantToDoFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      body: { "what-do-you-want-to-do-option": selection },
    } = req;
    if (selection === "Apply") {
      res.redirect("/apply");
    } else if (selection === "Claim") {
      res.redirect("/claim");
    } else {
      const renderOptions = {
        csrfToken,
        errorSummaries: {
          noJourneySelected: {
            text: "Select what you need to do",
          },
        },
      };
      res.render("main/index", renderOptions);
    }
  }
}
