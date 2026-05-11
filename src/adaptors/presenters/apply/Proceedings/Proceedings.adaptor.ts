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
    const selectedProceedings = req.session.selectedProceedings ?? [];
    const filteredProceedingOptions = this.formatter.filterAvailableOptions(
      selectedProceedings,
      PROCEEDING_OPTIONS,
    );
    const formattedProceedingOptions = this.formatter.formatOptionsIntoList(
      filteredProceedingOptions,
    );
    const formattedSelectedProceedings =
      this.formatter.formatSelectedIntoTableRows(selectedProceedings);

    res.render("apply/proceedings/add-proceedings", {
      csrfToken,
      proceedingOptions: formattedProceedingOptions,
      proceedingInput: req.session.proceedingInput,
      selectedProceedings: formattedSelectedProceedings,
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
    const selectedProceedings = req.session.selectedProceedings ?? [];
    const selectedProceeding = PROCEEDING_OPTIONS.find(
      (option) => option.proceedingId === proceedingOption,
    );

    if (
      (proceedingOption === undefined &&
        Object.keys(proceedingErrors).length > EMPTY_ARR_LENGTH) ||
      selectedProceeding === undefined
    ) {
      const filteredProceedingOptions = this.formatter.filterAvailableOptions(
        selectedProceedings,
        PROCEEDING_OPTIONS,
      );
      const formattedProceedingOptions = this.formatter.formatOptionsIntoList(
        filteredProceedingOptions,
      );
      const formattedSelectedProceedings =
        this.formatter.formatSelectedIntoTableRows(selectedProceedings);

      const renderOptions = {
        csrfToken,
        proceedingOptions: formattedProceedingOptions,
        proceedingOption: req.session.proceedingOption,
        selectedProceedings: formattedSelectedProceedings,
        errorSummaries: proceedingErrors,
      };

      res.render("apply/proceedings/add-proceedings", renderOptions);
    } else {
      req.session.proceedingOption = selectedProceeding;
      req.session.selectedProceedings = [
        selectedProceeding,
        ...selectedProceedings,
      ];
      res.redirect("/apply/proceedings/confirmation");
    }
  }

  renderProceedingsConfirmation(
    req: TypedRequestBody<Partial<ProceedingsFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    if (req.session.selectedProceedings === undefined) {
      res.redirect("/apply/proceedings");
    } else {
      const formattedSelectedProceedings =
        this.formatter.formatSelectedIntoTableRows(
          req.session.selectedProceedings,
        );

      const renderOptions = {
        csrfToken,
        selectedProceedings: formattedSelectedProceedings,
      };
      res.render("apply/proceedings/confirmation", renderOptions);
    }
  }

  processProceedingsConfirmation(
    req: TypedRequestBody<Partial<ProceedingsFormData>>,
    res: Response,
  ): void {
    const {
      locals: { csrfToken },
    } = res;
    const {
      body: { "add-another-proceeding": isAddingAnotherProceeding },
    } = req;

    const proceedingErrors = this.formValidator.validateAddAnotherProceeding(
      req.body,
    );

    if (Object.keys(proceedingErrors).length > EMPTY_ARR_LENGTH) {
      const selectedProceedings = req.session.selectedProceedings ?? [];
      const formattedSelectedProceedings =
        this.formatter.formatSelectedIntoTableRows(selectedProceedings);

      const renderOptions = {
        csrfToken,
        selectedProceedings: formattedSelectedProceedings,
        errorSummaries: proceedingErrors,
      };

      res.render("apply/proceedings/confirmation", renderOptions);
    } else if (isAddingAnotherProceeding === "true") {
      res.redirect("/apply/proceedings");
    } else if (isAddingAnotherProceeding === "false") {
      res.redirect("/apply/deceased-details/name");
    }
  }
}
