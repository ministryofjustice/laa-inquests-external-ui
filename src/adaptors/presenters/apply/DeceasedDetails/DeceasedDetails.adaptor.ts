import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";
import type { DeceasedDetailsFormData } from "../models/form.types.js";
import type { DeceasedDetailsValidator } from "./DeceasedDetails.validator.js";
import type { Request, Response } from "express";

export class DeceasedDetailsAdaptor {
  formValidator: DeceasedDetailsValidator;
  constructor(formValidator: DeceasedDetailsValidator) {
    this.formValidator = formValidator;
  }

  renderNameForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/deceased-details/name", { csrfToken });
  }

  processNameForm(
    req: TypedRequestBody<Partial<DeceasedDetailsFormData>>,
    res: Response,
  ): void {
    const errorSummaries = this.formValidator.validateName(req.body);
    const {
      locals: { csrfToken },
    } = res;

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("apply/deceased-details/name", { csrfToken, errorSummaries });
    } else {
      res.redirect("/apply/deceased-details/dod");
    }
  }
}
