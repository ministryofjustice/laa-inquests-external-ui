import type {
  ClientDetailsFormData,
  ClientNameDobError,
  ClientNinoError,
} from "#src/adaptors/presenters/apply/models/form.types.js";
import {
  CLIENT_DETAILS_ERROR,
  MAX_CHARACTER_LENGTH,
} from "#src/infrastructure/locales/constants.js";

export class FormValidator {
  #validateFormInputValue(
    inputValue: string | undefined,
    checkIsEmpty = true,
  ): boolean {
    return checkIsEmpty
      ? typeof inputValue === "string" && inputValue === ""
      : typeof inputValue === "string" &&
          inputValue.length > MAX_CHARACTER_LENGTH;
  }
  #checkDobFieldsAreEmpty(
    day: string | undefined,
    month: string | undefined,
    year: string | undefined,
  ): boolean {
    const isDayEmpty = this.#validateFormInputValue(day, true);
    const isMonthEmpty = this.#validateFormInputValue(month, true);
    const isYearEmpty = this.#validateFormInputValue(year, true);

    return isDayEmpty || isMonthEmpty || isYearEmpty;
  }
  #checkDobIsNotANumber(
    day: string | undefined,
    month: string | undefined,
    year: string | undefined,
  ): boolean {
    const isDayNaN = isNaN(parseInt(day ?? "", 10));
    const isMonthNaN = isNaN(parseInt(month ?? "", 10));
    const isYearNaN = isNaN(parseInt(year ?? "", 10));
    return isDayNaN || isMonthNaN || isYearNaN;
  }
  validateClientDob(
    formBody: Partial<ClientDetailsFormData>,
  ): Partial<ClientNameDobError> {
    const errorSummaries: Partial<ClientNameDobError> = {};
    const {
      "dob-day": dateOfBirthDay,
      "dob-month": dateOfBirthMonth,
      "dob-year": dateOfBirthYear,
    } = formBody;

    const isDateEmpty = this.#checkDobFieldsAreEmpty(
      dateOfBirthDay,
      dateOfBirthMonth,
      dateOfBirthYear,
    );
    const isDateNaN = this.#checkDobIsNotANumber(
      dateOfBirthDay,
      dateOfBirthMonth,
      dateOfBirthYear,
    );

    if (isDateNaN) {
      errorSummaries.dobInputError = {
        text: CLIENT_DETAILS_ERROR.NON_NUMERIC_DATE,
      };
    }

    if (isDateEmpty) {
      errorSummaries.dobInputError = {
        text: CLIENT_DETAILS_ERROR.MISSING_DOB_INPUT,
      };
    }

    if (!isDateEmpty || !isDateNaN) {
      const dateOfBirth = new Date(
        `${dateOfBirthYear}/${dateOfBirthMonth}/${dateOfBirthDay}`,
      );
      if (dateOfBirth > new Date()) {
        errorSummaries.dobInputError = {
          text: CLIENT_DETAILS_ERROR.FUTURE_DATE,
        };
      }
    }
    return errorSummaries;
  }

  validateClientName(
    formBody: Partial<ClientDetailsFormData>,
  ): Partial<ClientNameDobError> {
    const errorSummaries: Partial<ClientNameDobError> = {};

    const {
      "first-name": firstName,
      "last-name": lastName,
      "last-name-at-birth": lastNameAtBirth,
      "name-change": hasNameChanged,
    } = formBody;

    if (this.#validateFormInputValue(firstName)) {
      errorSummaries.firstNameInputError = {
        text: CLIENT_DETAILS_ERROR.MISSING_FIRST_NAME,
      };
    }

    if (this.#validateFormInputValue(firstName, false)) {
      errorSummaries.firstNameInputError = {
        text: CLIENT_DETAILS_ERROR.FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
      };
    }

    if (this.#validateFormInputValue(lastName)) {
      errorSummaries.lastNameInputError = {
        text: CLIENT_DETAILS_ERROR.MISSING_LAST_NAME,
      };
    }

    if (this.#validateFormInputValue(lastName, false)) {
      errorSummaries.lastNameInputError = {
        text: CLIENT_DETAILS_ERROR.LAST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
      };
    }

    if (typeof hasNameChanged !== "string") {
      errorSummaries.noRadioSelected = {
        text: CLIENT_DETAILS_ERROR.INPUT_NOT_SELECTED,
      };
    }

    if (
      typeof hasNameChanged === "string" &&
      hasNameChanged === "true" &&
      this.#validateFormInputValue(lastNameAtBirth)
    ) {
      errorSummaries.noBirthNameSpecified = {
        text: CLIENT_DETAILS_ERROR.MISSING_LAST_NAME_AT_BIRTH,
      };
    }
    return errorSummaries;
  }

  validateNino(
    formBody: Partial<ClientDetailsFormData>,
  ): Partial<ClientNinoError> {
    const errorSummaries: Partial<ClientNinoError> = {};

    const {
      "has-nino": hasNino,
      "nino-input": ninoInput
    } = formBody;
    
    if (typeof hasNino !== "string") {
      errorSummaries.noRadioSelected = {
        text: CLIENT_DETAILS_ERROR.INPUT_NOT_SELECTED,
      };
    }

    const ninoRegex = /^(?!BG)(?!GB)(?!NK)(?!KN)(?!TN)(?!NT)(?!ZZ)[A-CEG-HJ-TW-Z]{2}\s*[0-9]{6}\s*[A-D]{1}/iv;
    if (
      typeof hasNino === "string" &&
      hasNino === "true" &&
      this.#validateFormInputValue(ninoInput)
    ) {
      errorSummaries.ninoInputError = {
        text: CLIENT_DETAILS_ERROR.MISSING_NINO,
      };
    }else if(typeof hasNino === "string" &&
      hasNino === "true" && typeof ninoInput === "string" && !ninoRegex.test(ninoInput)){
        errorSummaries.ninoInputError = {
          text: CLIENT_DETAILS_ERROR.INVALID_NINO,
        };
    }

    return errorSummaries;
  }

}
