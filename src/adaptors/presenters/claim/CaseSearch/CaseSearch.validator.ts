import { FormValidator } from "#src/utils/FormValidator.js";
import {
  CASE_REFERENCE_MAX_CHARACTER_LENGTH,
  CASE_SEARCH_ERROR,
  CONTROL_CHARACTERS_REGEX,
} from "#src/infrastructure/locales/constants.js";
import { normaliseFreeText } from "#src/utils/textRules.js";

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

    if (typeof caseReference !== "string") {
      return errorSummaries;
    }

    // Only the content is restricted: any other text is searched for, so a typo shows no
    // results. The length is counted on the value as sent, because the API caps it as received.
    if (normaliseFreeText(caseReference) === "") {
      errorSummaries.caseReferenceInputError = {
        text: CASE_SEARCH_ERROR.MISSING_CASE_REFERENCE,
      };
    } else if (CONTROL_CHARACTERS_REGEX.test(caseReference)) {
      errorSummaries.caseReferenceInputError = {
        text: CASE_SEARCH_ERROR.CASE_REFERENCE_INVALID_CHARACTERS,
      };
    } else if (
      this.exceedsMaxLength(caseReference, CASE_REFERENCE_MAX_CHARACTER_LENGTH)
    ) {
      errorSummaries.caseReferenceInputError = {
        text: CASE_SEARCH_ERROR.CASE_REFERENCE_EXCEEDS_MAX_CHARACTER_LENGTH,
      };
    }

    return errorSummaries;
  }
}
