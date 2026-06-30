import type { Request, Response } from "express";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  CaseSearchError,
  CaseSearchFormData,
  CaseSearchValidator,
} from "./CaseSearch.validator.js";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";

export class CaseSearchAdaptor {
  formValidator: CaseSearchValidator;

  constructor(formValidator: CaseSearchValidator) {
    this.formValidator = formValidator;
  }

  renderForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("claim/case-search", {
      csrfToken,
    });
  }

  processForm(
    req: TypedRequestBody<Partial<CaseSearchFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;

    const errorSummaries: Partial<CaseSearchError> =
      this.formValidator.validateCaseSearch(req.body);

    if (Object.keys(errorSummaries).length > EMPTY_ARR_LENGTH) {
      res.render("claim/case-search", {
        csrfToken,
        caseReference: req.body["case-reference"],
        errorSummaries,
      });
      return;
    }

    res.redirect("/claim/results");
  }

  renderResults(req: Request, res: Response): void {
    res.render("claim/case-search-results");
  }
}
