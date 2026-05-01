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

  validateFormInputValue(
    inputValue: string | undefined,
    checkIsEmpty = true,
  ): boolean {
    return checkIsEmpty
      ? typeof inputValue === "string" && inputValue === ""
      : typeof inputValue === "string" &&
          inputValue.length > MAX_CHARACTER_LENGTH;
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

    if (this.validateFormInputValue(firstName)) {
      this.errorSummaries.firstNameInputError = {
        text: "Please enter your client's first name",
      };
    }

    if (this.validateFormInputValue(firstName, false)) {
      this.errorSummaries.firstNameInputError = {
        text: "First name(s) cannot exceed 100 characters",
      };
    }

    if (this.validateFormInputValue(lastName)) {
      this.errorSummaries.lastNameInputError = {
        text: "Please enter your client's last name",
      };
    }

    if (this.validateFormInputValue(lastName, false)) {
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
      this.validateFormInputValue(lastNameAtBirth)
    ) {
      this.errorSummaries.noBirthNameSpecified = {
        text: "Please enter the client's birth name",
      };
    }
  }
}
