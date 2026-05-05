import type {
  ClientDetailsFormData,
  ClientNameDobError,
} from "#src/adaptors/presenters/apply/models/form.types.js";
import { MAX_CHARACTER_LENGTH } from "#src/infrastructure/locales/constants.js";

export class FormValidator {
  errorSummaries: Partial<ClientNameDobError>;
  constructor() {
    this.errorSummaries = {};
  }

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
  validateClientDob(formBody: Partial<ClientDetailsFormData>): void {
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
      this.errorSummaries.dobInputError = {
        text: "Please enter date of birth in the format expected",
      };
    }

    if (isDateEmpty) {
      this.errorSummaries.dobInputError = {
        text: "Please enter date of birth",
      };
    }

    if (!isDateEmpty || !isDateNaN) {
      const dateOfBirth = new Date(
        `${dateOfBirthYear}/${dateOfBirthMonth}/${dateOfBirthDay}`,
      );
      if (dateOfBirth > new Date()) {
        this.errorSummaries.dobInputError = {
          text: "Date of birth must not be in the future",
        };
      }
    }
  }

  validateClientName(formBody: Partial<ClientDetailsFormData>): void {
    // check if keys exist
    //  if key exists
    const {
      "first-name": firstName,
      "last-name": lastName,
      "last-name-at-birth": lastNameAtBirth,
      "name-change": hasNameChanged,
    } = formBody;

    if (this.#validateFormInputValue(firstName)) {
      this.errorSummaries.firstNameInputError = {
        text: "Please enter your client's first name",
      };
    }

    if (this.#validateFormInputValue(firstName, false)) {
      this.errorSummaries.firstNameInputError = {
        text: "First name(s) cannot exceed 100 characters",
      };
    }

    if (this.#validateFormInputValue(lastName)) {
      this.errorSummaries.lastNameInputError = {
        text: "Please enter your client's last name",
      };
    }

    if (this.#validateFormInputValue(lastName, false)) {
      this.errorSummaries.lastNameInputError = {
        text: "Last name cannot exceed 100 characters",
      };
    }

    if (typeof hasNameChanged !== "string") {
      this.errorSummaries.noRadioSelected = { text: "Please select an option" };
    }

    if (
      typeof hasNameChanged === "string" &&
      hasNameChanged === "true" &&
      this.#validateFormInputValue(lastNameAtBirth)
    ) {
      this.errorSummaries.noBirthNameSpecified = {
        text: "Please enter the client's birth name",
      };
    }
  }
}
