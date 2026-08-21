import { FormValidator } from "#src/utils/FormValidator.js";
import { COUNSEL_NUMBER_ERROR } from "#src/infrastructure/locales/constants.js";

export interface CounselNumberError {
  counselNumberInputError?: { text: string };
}

export interface CounselNumberFormData {
  "counsel-number"?: string;
}

export class CounselNumberValidator extends FormValidator {
  validateCounselNumber(
    formBody: Partial<CounselNumberFormData>,
  ): Partial<CounselNumberError> {
    const errorSummaries: Partial<CounselNumberError> = {};
    const { "counsel-number": counselNumber } = formBody;

    if (typeof counselNumber !== "string") {
      errorSummaries.counselNumberInputError = {
        text: COUNSEL_NUMBER_ERROR.MISSING_COUNSEL_NUMBER,
      };
    }

    return errorSummaries;
  }
}
