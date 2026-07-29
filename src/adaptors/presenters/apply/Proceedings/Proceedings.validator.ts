import {
  PROCEEDING_ERROR,
  EMPTY_ARR_LENGTH,
} from "#src/infrastructure/locales/constants.js";
import { FormValidator } from "#src/utils/FormValidator.js";
import type {
  ProceedingsError,
  ProceedingsFormData,
} from "../models/form.types.js";

export class ProceedingsValidator extends FormValidator {
  validateProceedingInput(
    formBody: Partial<ProceedingsFormData>,
  ): Partial<ProceedingsError> {
    const errorSummaries: Partial<ProceedingsError> = {};

    const { "proceeding-option": proceedingOption } = formBody;

    if (typeof proceedingOption !== "string") {
      errorSummaries.noProceedingSelected = {
        text: PROCEEDING_ERROR.NO_PROCEEDING_SPECIFIED,
      };
    }

    return errorSummaries;
  }
}
