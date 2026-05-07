import { DECEASED_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";
import { FormValidator } from "#src/utils/FormValidator.js";
import type {
  DeceasedDetailsFormData,
  DeceasedNameError,
} from "../models/form.types.js";

export class DeceasedDetailsValidator extends FormValidator {
  validateName(formBody: Partial<DeceasedDetailsFormData>): DeceasedNameError {
    const errorSummaries: Partial<DeceasedNameError> = {};

    const { "deceased-first-name": firstName, "deceased-last-name": lastName } =
      formBody;

    if (this.validateFormInputValue(firstName)) {
      errorSummaries.firstNameInputError = {
        text: DECEASED_DETAILS_ERROR.MISSING_FIRST_NAME,
      };
    }

    if (this.validateFormInputValue(firstName, false)) {
      errorSummaries.firstNameInputError = {
        text: DECEASED_DETAILS_ERROR.FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
      };
    }

    if (this.validateFormInputValue(lastName)) {
      errorSummaries.lastNameInputError = {
        text: DECEASED_DETAILS_ERROR.MISSING_LAST_NAME,
      };
    }

    if (this.validateFormInputValue(lastName, false)) {
      errorSummaries.lastNameInputError = {
        text: DECEASED_DETAILS_ERROR.LAST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
      };
    }

    return errorSummaries;
  }
}
