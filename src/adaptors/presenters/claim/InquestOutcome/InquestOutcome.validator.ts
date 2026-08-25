import { FormValidator } from "#src/utils/FormValidator.js";
import {
  EMPTY_ARR_LENGTH,
  INQUEST_OUTCOME_ERROR,
} from "#src/infrastructure/locales/constants.js";

export interface InquestOutcomeError {
  inquestOutcomeInputError?: { text: string };
}

export interface InquestOutcomeFormData {
  "inquest-outcome"?: string | string[];
}

export class InquestOutcomeValidator extends FormValidator {
  validateOutcome(
    formBody: Partial<InquestOutcomeFormData>,
  ): Partial<InquestOutcomeError> {
    const errorSummaries: Partial<InquestOutcomeError> = {};
    const { "inquest-outcome": selection } = formBody;

    const hasSelection =
      (typeof selection === "string" && selection.length > EMPTY_ARR_LENGTH) ||
      (Array.isArray(selection) && selection.length > EMPTY_ARR_LENGTH);

    if (!hasSelection) {
      errorSummaries.inquestOutcomeInputError = {
        text: INQUEST_OUTCOME_ERROR.MISSING_SELECTION,
      };
    }

    return errorSummaries;
  }
}
