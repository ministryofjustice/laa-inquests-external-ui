import {
  DECEASED_CORONER_REFERENCE_MAX_CHARACTER_LENGTH,
  DECEASED_DETAILS_ERROR,
  DECEASED_FURTHER_INFORMATION_MAX_CHARACTER_LENGTH,
  DECEASED_FURTHER_INFORMATION_MIN_CHARACTER_LENGTH,
  DECEASED_RELATIONSHIP_MAX_CHARACTER_LENGTH,
} from "#src/infrastructure/locales/constants.js";
import { FormValidator } from "#src/utils/FormValidator.js";
import type {
  DeceasedClientRelationshipError,
  DeceasedCoronerReferenceError,
  DeceasedDateOfBirthError,
  DeceasedDateOfDeathError,
  DeceasedDetailsFormData,
  DeceasedFurtherInformationError,
  DeceasedNameError,
} from "../models/form.types.js";

export class DeceasedDetailsValidator extends FormValidator {
  // # TODO Step 3: Move this to application/apply/deceasedDetails/validators/DeceasedDetailsValidator.
  validateName(formBody: Partial<DeceasedDetailsFormData>): DeceasedNameError {
    // # TODO Step 3: Move this to application/apply/deceasedDetails/validators with shared error contract.
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
    // # TODO Step 3: Move this to application/apply/deceasedDetails/validators/dateOfDeathPolicy.
    const errorSummaries: Partial<DeceasedDateOfDeathError> = {};

    const {
      "deceased-date-of-death-day": dateOfDeathDay,
      "deceased-date-of-death-month": dateOfDeathMonth,
      "deceased-date-of-death-year": dateOfDeathYear,
    } = formBody;

    const errorMessage = this.validateDateInput(
      dateOfDeathDay,
      dateOfDeathMonth,
      dateOfDeathYear,
      {
        missing: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_DEATH_INPUT,
        nonNumeric: DECEASED_DETAILS_ERROR.NON_NUMERIC_DATE_OF_DEATH,
        invalidDate: DECEASED_DETAILS_ERROR.INVALID_DATE,
        futureDate: DECEASED_DETAILS_ERROR.FUTURE_DATE_OF_DEATH,
      },
    );

    if (typeof errorMessage === "string") {
      errorSummaries.dateOfDeathInputError = {
        text: errorMessage,
      };
    }

    return errorSummaries;
  }

  validateDeceasedDateOfBirth(
    formBody: Partial<DeceasedDetailsFormData>,
  ): Partial<DeceasedDateOfBirthError> {
    // # TODO Step 3: Move this to application/apply/deceasedDetails/validators/dateOfBirthPolicy.
    const errorSummaries: Partial<DeceasedDateOfBirthError> = {};

    const {
      "deceased-date-of-birth-day": dateOfBirthDay,
      "deceased-date-of-birth-month": dateOfBirthMonth,
      "deceased-date-of-birth-year": dateOfBirthYear,
    } = formBody;

    const errorMessage = this.validateDateInput(
      dateOfBirthDay,
      dateOfBirthMonth,
      dateOfBirthYear,
      {
        missing: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_BIRTH_INPUT,
        nonNumeric: DECEASED_DETAILS_ERROR.NON_NUMERIC_DATE_OF_BIRTH,
        invalidDate: DECEASED_DETAILS_ERROR.INVALID_DATE,
        futureDate: DECEASED_DETAILS_ERROR.FUTURE_DATE_OF_BIRTH,
      },
    );

    if (typeof errorMessage === "string") {
      errorSummaries.dateOfBirthInputError = {
        text: errorMessage,
      };
    }

    return errorSummaries;
  }

  validateClientRelationship(
    formBody: Partial<DeceasedDetailsFormData>,
  ): Partial<DeceasedClientRelationshipError> {
    // # TODO Step 1: Move this to domain/deceased/Relationship.ts (eligibility rule for "false" branch).
    // # TODO Step 3: Move this to application/apply/deceasedDetails/validators/relationshipInputPolicy.
    const errorSummaries: Partial<DeceasedClientRelationshipError> = {};
    const {
      "deceased-has-client-relationship": hasClientRelationship,
      "deceased-client-relationship": clientRelationship,
    } = formBody;

    if (typeof hasClientRelationship !== "string") {
      errorSummaries.hasClientRelationshipInputError = {
        text: DECEASED_DETAILS_ERROR.RELATIONSHIP_SELECTION_REQUIRED,
      };
      return errorSummaries;
    }

    if (hasClientRelationship === "false") {
      errorSummaries.hasClientRelationshipInputError = {
        text: DECEASED_DETAILS_ERROR.RELATIONSHIP_NOT_ELIGIBLE,
      };
      return errorSummaries;
    }

    if (this.validateFormInputValue(clientRelationship)) {
      errorSummaries.clientRelationshipInputError = {
        text: DECEASED_DETAILS_ERROR.RELATIONSHIP_REQUIRED_MIN_MAX,
      };
    } else if (
      this.exceedsMaxLength(
        clientRelationship,
        DECEASED_RELATIONSHIP_MAX_CHARACTER_LENGTH,
      )
    ) {
      errorSummaries.clientRelationshipInputError = {
        text: DECEASED_DETAILS_ERROR.RELATIONSHIP_EXCEEDS_MAX_CHARACTER_LENGTH,
      };
    }

    return errorSummaries;
  }

  validateCoronerReference(
    formBody: Partial<DeceasedDetailsFormData>,
  ): Partial<DeceasedCoronerReferenceError> {
    // # TODO Step 3: Move this to application/apply/deceasedDetails/validators/coronerReferencePolicy.
    const errorSummaries: Partial<DeceasedCoronerReferenceError> = {};
    const { "deceased-coroner-reference": coronerReference } = formBody;

    if (
      this.exceedsMaxLength(
        coronerReference,
        DECEASED_CORONER_REFERENCE_MAX_CHARACTER_LENGTH,
      )
    ) {
      errorSummaries.coronerReferenceInputError = {
        text: DECEASED_DETAILS_ERROR.CORONER_REFERENCE_EXCEEDS_MAX_CHARACTER_LENGTH,
      };
    }

    return errorSummaries;
  }

  validateFurtherInformation(
    formBody: Partial<DeceasedDetailsFormData>,
  ): Partial<DeceasedFurtherInformationError> {
    // # TODO Step 3: Move this to application/apply/deceasedDetails/validators/furtherInformationPolicy.
    const errorSummaries: Partial<DeceasedFurtherInformationError> = {};
    const {
      "deceased-has-further-information": hasFurtherInformation,
      "deceased-further-information": furtherInformation,
    } = formBody;

    if (typeof hasFurtherInformation !== "string") {
      errorSummaries.hasFurtherInformationInputError = {
        text: DECEASED_DETAILS_ERROR.FURTHER_INFORMATION_SELECTION_REQUIRED,
      };
      return errorSummaries;
    }

    if (
      hasFurtherInformation === "true" &&
      this.validateMinMaxLength(
        furtherInformation,
        DECEASED_FURTHER_INFORMATION_MIN_CHARACTER_LENGTH,
        DECEASED_FURTHER_INFORMATION_MAX_CHARACTER_LENGTH,
      )
    ) {
      errorSummaries.furtherInformationInputError = {
        text: DECEASED_DETAILS_ERROR.FURTHER_INFORMATION_MIN_MAX,
      };
    }

    return errorSummaries;
  }
}
