import { PROCEEDING_ERROR } from "#src/infrastructure/locales/constants.js";
import type {
  ProceedingsError,
  ProceedingsFormData,
} from "#src/adaptors/presenters/apply/models/form.types.js";
import type { ProceedingsValidator } from "#src/adaptors/presenters/apply/Proceedings/Proceedings.validator.js";

export type ProcessProceedingSelectionResult<TProceeding> =
  | {
      type: "validationError";
      errorSummaries: Partial<ProceedingsError>;
    }
  | {
      type: "success";
      selectedProceeding: TProceeding;
      selectedProceedings: TProceeding[];
    };

export class ProcessProceedingSelection<
  TProceeding extends { proceedingId: string },
> {
  readonly #formValidator: ProceedingsValidator;
  readonly #proceedingOptions: TProceeding[];

  constructor(
    formValidator: ProceedingsValidator,
    proceedingOptions: TProceeding[],
  ) {
    this.#formValidator = formValidator;
    this.#proceedingOptions = proceedingOptions;
  }

  execute(
    formBody: Partial<ProceedingsFormData>,
    selectedProceedings: TProceeding[],
  ): ProcessProceedingSelectionResult<TProceeding> {
    const proceedingErrors = this.#formValidator.validateProceedingInput(formBody);
    const selectedProceedingOption = formBody["proceeding-option"];

    if (typeof selectedProceedingOption !== "string") {
      return {
        type: "validationError",
        errorSummaries: proceedingErrors,
      };
    }

    const selectedProceeding = this.#proceedingOptions.find(
      (option) => option.proceedingId === selectedProceedingOption,
    );

    if (selectedProceeding === undefined) {
      return {
        type: "validationError",
        errorSummaries: {
          ...proceedingErrors,
          noProceedingSelected: {
            text: PROCEEDING_ERROR.NO_PROCEEDING_SPECIFIED,
          },
        },
      };
    }

    return {
      type: "success",
      selectedProceeding,
      selectedProceedings: [selectedProceeding, ...selectedProceedings],
    };
  }
}


