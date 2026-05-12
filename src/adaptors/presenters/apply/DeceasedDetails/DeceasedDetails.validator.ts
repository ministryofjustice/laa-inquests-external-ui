import { DECEASED_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";
import { FormValidator } from "#src/utils/FormValidator.js";
import type {
  DeceasedDateOfDeathError,
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

  validateDeceasedDateOfDeath(
    formBody: Partial<DeceasedDetailsFormData>,
  ): Partial<DeceasedDateOfDeathError> {
    const errorSummaries: Partial<DeceasedDateOfDeathError> = {};

    const {
      "deceased-date-of-death-day": dateOfDeathDay,
      "deceased-date-of-death-month": dateOfDeathMonth,
      "deceased-date-of-death-year": dateOfDeathYear,
    } = formBody;

    const isDateEmpty = this.checkDateFieldsAreEmpty(
      dateOfDeathDay,
      dateOfDeathMonth,
      dateOfDeathYear,
    );

    const isDateNaN = this.checkDateIsNotANumber(
      dateOfDeathDay,
      dateOfDeathMonth,
      dateOfDeathYear,
    );

    const isDayAndMonthInvalid = !this.checkDateIsValid(
      dateOfDeathDay,
      dateOfDeathMonth,
      dateOfDeathYear,
    );

    if (isDateEmpty) {
      errorSummaries.dateOfDeathInputError = {
        text: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_DEATH_INPUT,
      };
    } else if (isDateNaN) {
      errorSummaries.dateOfDeathInputError = {
        text: DECEASED_DETAILS_ERROR.NON_NUMERIC_DATE_OF_DEATH,
      };
    } else if (isDayAndMonthInvalid) {
      errorSummaries.dateOfDeathInputError = {
        text: DECEASED_DETAILS_ERROR.INVALID_DATE,
      };
    } else {
      const dateOfBirth = new Date(
        `${dateOfDeathDay}/${dateOfDeathMonth}/${dateOfDeathYear}`,
      );
      if (dateOfBirth > new Date()) {
        errorSummaries.dateOfDeathInputError = {
          text: DECEASED_DETAILS_ERROR.FUTURE_DATE_OF_DEATH,
        };
      }
    }

    return errorSummaries;
  }
}
