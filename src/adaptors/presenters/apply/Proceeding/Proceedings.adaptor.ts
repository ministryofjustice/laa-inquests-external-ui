import type { Request, Response } from "express";
import {
  EMPTY_ARR_LENGTH,
  PROCEEDING_OPTIONS,
} from "#src/infrastructure/locales/constants.js";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type { ProceedingsFormData } from "../models/form.types.js";
import type { ProceedingsValidator } from "./Proceedings.validator.js";
import type { Formatter } from "#src/utils/Formatter.js";

export class ProceedingsAdaptor {
  formValidator: ProceedingsValidator;
  formatter: Formatter;

  constructor(formValidator: ProceedingsValidator, formatter: Formatter) {
    this.formValidator = formValidator;
    this.formatter = formatter;
  }
  renderProceedingSelectForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;

    res.render("apply/proceedings/add-proceedings", {
      csrfToken,
      proceedingOptions:
        this.formatter.formatOptionsIntoList(PROCEEDING_OPTIONS),
      proceedingInput: req.session.proceedingInput,
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
    //TODO: Refactor the subsequent if statement. We have removed the use case from here
    const selectedProceeding = PROCEEDING_OPTIONS.find(
      (option) => option.proceedingId === proceedingOption,
    );

    if (
      (proceedingOption === undefined &&
        Object.keys(proceedingErrors).length > EMPTY_ARR_LENGTH) ||
      selectedProceeding === undefined
    ) {
      const renderOptions = {
        csrfToken,
        proceedingOptions:
          this.formatter.formatOptionsIntoList(PROCEEDING_OPTIONS),
        proceedingOption: req.session.proceedingOption,
        errorSummaries: proceedingErrors,
      };

      res.render("apply/proceedings/add-proceedings", renderOptions);
    } else {
      req.session.proceedingOption = { ...selectedProceeding };
      req.session.selectedProceeding = selectedProceeding;
      res.redirect("/apply/deceased-details/name");
    }
  }
}
