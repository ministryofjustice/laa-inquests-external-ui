import { FormValidator } from "#src/utils/FormValidator.js";
import { INQUEST_OUTCOME_ERROR } from "#src/infrastructure/locales/constants.js";

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
    const selection = formBody["inquest-outcome"];

    const hasSelection =
      (typeof selection === "string" && selection.length > 0) ||
      (Array.isArray(selection) && selection.length > 0);

    if (!hasSelection) {
      errorSummaries.inquestOutcomeInputError = {
        text: INQUEST_OUTCOME_ERROR.MISSING_SELECTION,
      };
    }

    return errorSummaries;
  }
}
