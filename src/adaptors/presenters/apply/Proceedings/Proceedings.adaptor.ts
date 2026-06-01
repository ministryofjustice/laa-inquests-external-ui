import type { Request, Response } from "express";
import {
  EMPTY_ARR_LENGTH,
  PROCEEDING_OPTIONS,
} from "#src/infrastructure/locales/constants.js";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  ProceedingsFormData,
  RemoveProceedingFormData,
} from "../models/form.types.js";
import type { ProceedingsValidator } from "./Proceedings.validator.js";
import type { Formatter } from "#src/utils/Formatter.js";

export class ProceedingsAdaptor {
  // # TODO Step 2: Move this to application/apply/proceedings/useCases.
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
    // # TODO Step 2: Move this to application/apply/proceedings/useCases/ProcessProceedingSelection.
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
    const {
      session: { selectedProceedings, successMessage },
    } = req;

    if (selectedProceedings === undefined) {
      res.redirect("/apply/proceedings");
    } else {
      const formattedSelectedProceedings =
        this.formatter.formatSelectedIntoTableRows(selectedProceedings);

      req.session.successMessage = undefined;

      const renderOptions = {
        csrfToken,
        selectedProceedings: formattedSelectedProceedings,
        successMessage,
      };
      res.render("apply/proceedings/confirmation", renderOptions);
    }
  }

  processProceedingsConfirmation(
    req: TypedRequestBody<Partial<ProceedingsFormData>>,
    res: Response,
  ): void {
    // # TODO Step 2: Move this to application/apply/proceedings/useCases/ConfirmProceedings.
    const {
      locals: { csrfToken },
    } = res;
    const {
      body: { "add-another-proceeding": isAddingAnotherProceeding },
      session: { selectedProceedings = [] },
    } = req;

    const formattedSelectedProceedings =
      this.formatter.formatSelectedIntoTableRows(selectedProceedings);

    const proceedingErrors = this.formValidator.validateAddAnotherProceeding(
      req.body,
    );

    if (Object.keys(proceedingErrors).length > EMPTY_ARR_LENGTH) {
      const renderOptions = {
        csrfToken,
        selectedProceedings: formattedSelectedProceedings,
        errorSummaries: proceedingErrors,
      };

      res.render("apply/proceedings/confirmation", renderOptions);
    } else if (isAddingAnotherProceeding === "true") {
      res.redirect("/apply/proceedings");
    } else if (isAddingAnotherProceeding === "false") {
      const proceedingListErrors =
        this.formValidator.validateProceedingList(selectedProceedings);

      if (Object.keys(proceedingListErrors).length > EMPTY_ARR_LENGTH) {
        const renderOptions = {
          csrfToken,
          selectedProceedings: formattedSelectedProceedings,
          errorSummaries: proceedingListErrors,
        };

        res.render("apply/proceedings/confirmation", renderOptions);
        return;
      }

      res.redirect("/apply/deceased-details/name");
    }
  }

  renderProceedingsRemoveForm(req: Request, res: Response): void {
    const {
      query: { proceedingId },
      session: { selectedProceedings },
    } = req;
    const {
      locals: { csrfToken },
    } = res;

    if (typeof proceedingId !== "string") {
      res.redirect("/apply/proceedings/confirmation");
      return;
    }

    if (selectedProceedings === undefined) {
      res.redirect("/apply/proceedings");
    } else {
      const proceedingToRemove = selectedProceedings.find(
        (proceeding) => proceeding.proceedingId === proceedingId,
      );

      if (proceedingToRemove === undefined) {
        res.redirect("/apply/proceedings/confirmation");
      } else {
        res.render("apply/proceedings/remove-proceeding", {
          csrfToken,
          proceedingName: proceedingToRemove.proceedingDescription,
          proceedingId: proceedingToRemove.proceedingId,
        });
      }
    }
  }

  processProceedingsRemove(
    req: TypedRequestBody<RemoveProceedingFormData>,
    res: Response,
  ): void {
    // # TODO Step 2: Move this to application/apply/proceedings/useCases/RemoveProceeding.
    const {
      body: { proceedingId, "remove-proceeding": removeProceeding },
      session: { selectedProceedings },
    } = req;

    if (removeProceeding === "true") {
      // # TODO Step 1: Move this to domain/proceedings/ProceedingsSelection.ts invariants.
      const updatedSelectedProceedings = selectedProceedings?.filter(
        (proceeding) => proceeding.proceedingId !== proceedingId,
      );

      req.session.selectedProceedings = updatedSelectedProceedings;
      req.session.successMessage = "Proceeding has been removed";
    }

    res.redirect("/apply/proceedings/confirmation");
  }
}
