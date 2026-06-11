import type { Request, Response } from "express";
import { EMPTY_ARR_LENGTH } from "#src/infrastructure/locales/constants.js";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type {
  ProceedingsFormData,
  RemoveProceedingFormData,
} from "../models/form.types.js";
import type { ProceedingsValidator } from "./Proceedings.validator.js";
import type { Formatter } from "#src/utils/Formatter.js";
import { BuildProceedingsSelectionViewUseCase } from "#src/use-cases/apply/proceedings/BuildProceedingsSelectionView.useCase.js";
import { AddProceedingUseCase } from "#src/use-cases/apply/proceedings/AddProceeding.useCase.js";
import { RemoveProceedingUseCase } from "#src/use-cases/apply/proceedings/RemoveProceeding.useCase.js";

interface ProceedingsUseCases {
  buildProceedingsSelectionView: BuildProceedingsSelectionViewUseCase;
  addProceeding: AddProceedingUseCase;
  removeProceeding: RemoveProceedingUseCase;
}

export class ProceedingsAdaptor {
  formValidator: ProceedingsValidator;
  formatter: Formatter;
  buildProceedingsSelectionViewUseCase: BuildProceedingsSelectionViewUseCase;
  addProceedingUseCase: AddProceedingUseCase;
  removeProceedingUseCase: RemoveProceedingUseCase;

  constructor(
    formValidator: ProceedingsValidator,
    formatter: Formatter,
    useCases?: Partial<ProceedingsUseCases>,
  ) {
    this.formValidator = formValidator;
    this.formatter = formatter;
    this.buildProceedingsSelectionViewUseCase =
      useCases?.buildProceedingsSelectionView ??
      new BuildProceedingsSelectionViewUseCase(formatter);
    this.addProceedingUseCase =
      useCases?.addProceeding ?? new AddProceedingUseCase();
    this.removeProceedingUseCase =
      useCases?.removeProceeding ?? new RemoveProceedingUseCase();
  }
  renderProceedingSelectForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    const selectionView = this.buildProceedingsSelectionViewUseCase.execute({
      selectedProceedings: req.session.selectedProceedings,
    });

    res.render("apply/proceedings/add-proceedings", {
      csrfToken,
      proceedingOptions: selectionView.proceedingOptions,
      proceedingInput: req.session.proceedingInput,
      selectedProceedings: selectionView.selectedProceedings,
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
    const addProceedingResult = this.addProceedingUseCase.execute(
      proceedingOption,
      {
        selectedProceedings: req.session.selectedProceedings,
      },
    );

    if (
      (proceedingOption === undefined &&
        Object.keys(proceedingErrors).length > EMPTY_ARR_LENGTH) ||
      addProceedingResult.status !== "SUCCESS" ||
      addProceedingResult.data === undefined
    ) {
      const selectionView = this.buildProceedingsSelectionViewUseCase.execute({
        selectedProceedings: req.session.selectedProceedings,
      });

      const renderOptions = {
        csrfToken,
        proceedingOptions: selectionView.proceedingOptions,
        proceedingOption: req.session.proceedingOption,
        selectedProceedings: selectionView.selectedProceedings,
        errorSummaries: proceedingErrors,
      };

      res.render("apply/proceedings/add-proceedings", renderOptions);
    } else {
      const { data } = addProceedingResult;
      const { selectedProceeding, selectedProceedings } = data;

      req.session.proceedingOption = { ...selectedProceeding };
      req.session.selectedProceedings = selectedProceedings;
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
      const selectionView = this.buildProceedingsSelectionViewUseCase.execute({
        selectedProceedings,
      });

      req.session.successMessage = undefined;

      const renderOptions = {
        csrfToken,
        selectedProceedings: selectionView.selectedProceedings,
        successMessage,
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
    const {
      body: { proceedingId, "remove-proceeding": removeProceeding },
      session: { selectedProceedings },
    } = req;

    const removeProceedingResult = this.removeProceedingUseCase.execute(
      proceedingId,
      removeProceeding,
      {
        selectedProceedings,
      },
    );

    if (
      removeProceedingResult.status === "SUCCESS" &&
      removeProceedingResult.data?.successMessage !== undefined
    ) {
      const { data } = removeProceedingResult;
      const { selectedProceedings: updatedProceedings, successMessage } = data;
      req.session.selectedProceedings = updatedProceedings;
      req.session.successMessage = successMessage;
    }

    res.redirect("/apply/proceedings/confirmation");
  }
}
