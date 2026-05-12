import type { Request, Response } from "express";
import {
  EMPTY_ARR_LENGTH,
  PROCEEDING_OPTIONS,
} from "#src/infrastructure/locales/constants.js";
import type { TypedRequestBody } from "#src/infrastructure/express/index.types.js";
import type { Option, ProceedingsFormData } from "./models/form.types.js";
import type { Proceeding } from "#src/infrastructure/express/session/index.types.js";
import type { SummaryListRow } from "./models/summaryList.types.js";
import type { ProceedingsValidator } from "./Proceedings/Proceedings.validator.js";

export class ProceedingsAdaptor {
  formValidator: ProceedingsValidator;
  constructor(formValidator: ProceedingsValidator) {
    this.formValidator = formValidator;
  }
  renderProceedingSelectForm(req: Request, res: Response): void {
    const {
      locals: { csrfToken },
    } = res;
    const selectedProceedings = req.session.selectedProceedings ?? [];
    const filteredProceedingOptions = this.#filterProceedingOptions(
      selectedProceedings,
      PROCEEDING_OPTIONS,
    );
    const formattedProceedingOptions = this.#formatProceedingOptions(
      filteredProceedingOptions,
    );
    const formattedSelectedProceedings =
      this.#formatSelectedProceedings(selectedProceedings);

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
      const filteredProceedingOptions = this.#filterProceedingOptions(
        selectedProceedings,
        PROCEEDING_OPTIONS,
      );
      const formattedProceedingOptions = this.#formatProceedingOptions(
        filteredProceedingOptions,
      );
      const formattedSelectedProceedings =
        this.#formatSelectedProceedings(selectedProceedings);

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
      const formattedSelectedProceedings = this.#formatSelectedProceedings(
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
        this.#formatSelectedProceedings(selectedProceedings);

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

  #filterProceedingOptions(
    selectedProceedings: Proceeding[],
    allProceedings: Proceeding[],
  ): Proceeding[] {
    const formattedProceedingOptions = allProceedings.filter(
      (option) =>
        !selectedProceedings.some(
          (selectedOption) =>
            selectedOption.proceedingId === option.proceedingId,
        ),
    );

    return formattedProceedingOptions;
  }

  #formatProceedingOptions(proceedingOptions: Proceeding[]): Option[] {
    return proceedingOptions.map((proceeding) => ({
      text: proceeding.proceedingDescription,
      value: proceeding.proceedingId,
    }));
  }

  #formatSelectedProceedings(
    selectedProceedings: Proceeding[],
  ): SummaryListRow[] {
    const formattedSelectedProceedings = selectedProceedings.map(
      (proceeding) => ({
        key: { text: proceeding.proceedingId },
        value: { text: proceeding.proceedingDescription },
        actions: {
          items: [
            {
              text: "Remove",
            },
          ],
        },
      }),
    );
    return formattedSelectedProceedings;
  }
}
