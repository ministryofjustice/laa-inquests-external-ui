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
import { ProcessProceedingSelection } from "#src/application/apply/proceedings/useCases/ProcessProceedingSelection.js";
import { ProceedingsSelection } from "#src/domain/proceedings/ProceedingsSelection.js";

export class ProceedingsAdaptor {
  // # TODO Step 2: Move this to application/apply/proceedings/useCases.
  formValidator: ProceedingsValidator;
  formatter: Formatter;
  processProceedingSelection: ProcessProceedingSelection<
    (typeof PROCEEDING_OPTIONS)[number]
  >;
  constructor(
    formValidator: ProceedingsValidator,
    formatter: Formatter,
    processProceedingSelection = new ProcessProceedingSelection(
      formValidator,
      PROCEEDING_OPTIONS,
    ),
  ) {
    this.formValidator = formValidator;
    this.formatter = formatter;
    this.processProceedingSelection = processProceedingSelection;
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
    const selectedProceedings = req.session.selectedProceedings ?? [];

    const processResult = this.processProceedingSelection.execute(
      req.body,
      selectedProceedings,
    );

    if (processResult.type === "validationError") {
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
        errorSummaries: processResult.errorSummaries,
      };

      res.render("apply/proceedings/add-proceedings", renderOptions);
    } else {
      const { selectedProceeding, selectedProceedings: updatedProceedings } =
        processResult;
      req.session.proceedingOption = selectedProceeding;
      req.session.selectedProceedings = updatedProceedings;
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
      const updatedSelectedProceedings = ProceedingsSelection.removeById(
        selectedProceedings,
        proceedingId,
      );

      req.session.selectedProceedings = updatedSelectedProceedings;
      req.session.successMessage = "Proceeding has been removed";
    }

    res.redirect("/apply/proceedings/confirmation");
  }
}
