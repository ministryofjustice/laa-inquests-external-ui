import { FormValidator } from "#src/utils/FormValidator.js";
import { CASE_SEARCH_ERROR } from "#src/infrastructure/locales/constants.js";

export interface CaseSearchError {
  caseReferenceInputError?: { text: string };
}

export interface CaseSearchFormData {
  "case-reference"?: string;
}

export class CaseSearchValidator extends FormValidator {
  validateCaseSearch(
    formBody: Partial<CaseSearchFormData>,
  ): Partial<CaseSearchError> {
    const errorSummaries: Partial<CaseSearchError> = {};
    const { "case-reference": caseReference } = formBody;

    if (
      caseReference === undefined ||
      this.validateFormInputValue(caseReference, true)
    ) {
      errorSummaries.caseReferenceInputError = {
        text: CASE_SEARCH_ERROR.MISSING_CASE_REFERENCE,
      };
    }

    return errorSummaries;
  }
}
