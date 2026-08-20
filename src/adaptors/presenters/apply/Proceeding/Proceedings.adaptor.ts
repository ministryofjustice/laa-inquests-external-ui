import type { Request, Response } from "express";
import {
  EMPTY_ARR_LENGTH,
  PROCEEDING_OPTIONS,
} from "#src/infrastructure/locales/constants.js";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type { ProceedingsFormData } from "../models/form.types.js";
import type { ProceedingValidator } from "./Proceeding.validator.js";
import type { Formatter } from "#src/utils/Formatter.js";

export class ProceedingsAdaptor {
  formValidator: ProceedingValidator;
  formatter: Formatter;

  constructor(formValidator: ProceedingValidator, formatter: Formatter) {
    this.formValidator = formValidator;
    this.formatter = formatter;
  }
  renderProceedingSelectForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    this.#captureCheckYourAnswersEntry(req);

    res.render("apply/proceeding/add-proceedings", {
      csrfToken,
      proceedingOptions:
        this.formatter.formatOptionsIntoList(PROCEEDING_OPTIONS),
      proceedingOption: req.session.proceedingOption?.proceedingId ?? "",
      backHref: this.#resolveBackHref(req),
    });
  }

  processProceedingsForm(
    req: TypedRequestBody<Partial<ProceedingsFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      body: { "proceeding-option": proceedingOption },
    } = req;
    const proceedingErrors = this.formValidator.validateProceedingInput(
      req.body,
    );
    const selectedProceeding = PROCEEDING_OPTIONS.find(
      (option) => option.proceedingId === proceedingOption,
    );

    if (
      Object.keys(proceedingErrors).length > EMPTY_ARR_LENGTH ||
      selectedProceeding === undefined
    ) {
      const renderOptions = {
        csrfToken,
        proceedingOptions:
          this.formatter.formatOptionsIntoList(PROCEEDING_OPTIONS),
        proceedingOption: req.session.proceedingOption?.proceedingId ?? "",
        errorSummaries: proceedingErrors,
      };

      res.render("apply/proceeding/add-proceedings", renderOptions);
    } else {
      req.session.proceedingOption = { ...selectedProceeding };
      req.session.selectedProceeding = selectedProceeding;
      if (req.session.returnToApplyCheckYourAnswers === true) {
        req.session.returnToApplyCheckYourAnswers = undefined;
        res.redirect("/apply/check-your-answers");
      } else {
        res.redirect("/apply/deceased-details/name");
      }
    }
  }

  #captureCheckYourAnswersEntry(req: Request): void {
    if (req.query.from === "check-your-answers") {
      req.session.returnToApplyCheckYourAnswers = true;
    }
  }

  #resolveBackHref(req: Request): string {
    if (req.session.returnToApplyCheckYourAnswers === true) {
      return "/apply/check-your-answers";
    }

    return "/apply/client-details/correspondence-recipient";
  }
}
