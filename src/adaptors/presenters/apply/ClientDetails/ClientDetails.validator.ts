import type {
  ClientCorrespondenceAddressSourceError,
  ClientCorrespondenceRecipientError,
  ClientDetailsFormData,
  ClientHomeAddressError,
  ClientNameDobError,
  ClientNinoError,
  ClientPrevApplicationRefError,
} from "#src/adaptors/presenters/apply/models/form.types.js";
import {
  CLIENT_DETAILS_ERROR,
  CORRESPONDENCE_RECIPIENT_ALLOWED_CHARACTERS_REGEX,
  CORRESPONDENCE_TOWN_OR_CITY_MAX_LENGTH,
  CORRESPONDENCE_ADDRESS_SOURCE,
  CORRESPONDENCE_RECIPIENT_TYPE,
  NINO_REGEX,
} from "#src/infrastructure/locales/constants.js";
import { FormValidator } from "#src/utils/FormValidator.js";
import { validateAddressFields } from "#src/adaptors/presenters/apply/ClientDetails/addressValidation.js";

const HOME_ADDRESS_VALIDATION_MESSAGES = {
  line1Missing: CLIENT_DETAILS_ERROR.MISSING_HOME_ADDRESS_LINE_1,
  line1MinMax: CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_1_MIN_MAX_LENGTH,
  line1RequiresAlphanumeric:
    CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_1_REQUIRES_ALPHANUMERIC_CHARACTER,
  line1InvalidCharacters:
    CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_1_INVALID_CHARACTERS,
  line2MinMax: CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_2_MIN_MAX_LENGTH,
  line2RequiresAlphanumeric:
    CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_2_REQUIRES_ALPHANUMERIC_CHARACTER,
  line2InvalidCharacters:
    CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_2_INVALID_CHARACTERS,
  townOrCityMissing: CLIENT_DETAILS_ERROR.MISSING_HOME_TOWN_OR_CITY,
  townOrCityMinMax: CLIENT_DETAILS_ERROR.HOME_TOWN_OR_CITY_MIN_MAX_LENGTH,
  townOrCityInvalidCharacters:
    CLIENT_DETAILS_ERROR.HOME_TOWN_OR_CITY_INVALID_CHARACTERS,
  countyMinMax: CLIENT_DETAILS_ERROR.HOME_COUNTY_MIN_MAX_LENGTH,
  countyInvalidCharacters: CLIENT_DETAILS_ERROR.HOME_COUNTY_INVALID_CHARACTERS,
  postcodeMissing: CLIENT_DETAILS_ERROR.MISSING_HOME_POSTCODE,
  postcodeMinMax: CLIENT_DETAILS_ERROR.HOME_POSTCODE_MIN_MAX_LENGTH,
  postcodeInvalidCharacters:
    CLIENT_DETAILS_ERROR.HOME_POSTCODE_INVALID_CHARACTERS,
};

const CORRESPONDENCE_ADDRESS_VALIDATION_MESSAGES = {
  line1Missing: CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_ADDRESS_LINE_1,
  line1MinMax:
    CLIENT_DETAILS_ERROR.CORRESPONDENCE_ADDRESS_LINE_1_MIN_MAX_LENGTH,
  line1RequiresAlphanumeric:
    CLIENT_DETAILS_ERROR.CORRESPONDENCE_ADDRESS_LINE_1_REQUIRES_ALPHANUMERIC_CHARACTER,
  line1InvalidCharacters:
    CLIENT_DETAILS_ERROR.CORRESPONDENCE_ADDRESS_LINE_1_INVALID_CHARACTERS,
  line2MinMax:
    CLIENT_DETAILS_ERROR.CORRESPONDENCE_ADDRESS_LINE_2_MIN_MAX_LENGTH,
  line2RequiresAlphanumeric:
    CLIENT_DETAILS_ERROR.CORRESPONDENCE_ADDRESS_LINE_2_REQUIRES_ALPHANUMERIC_CHARACTER,
  line2InvalidCharacters:
    CLIENT_DETAILS_ERROR.CORRESPONDENCE_ADDRESS_LINE_2_INVALID_CHARACTERS,
  townOrCityMissing: CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_TOWN_OR_CITY,
  townOrCityMinMax:
    CLIENT_DETAILS_ERROR.CORRESPONDENCE_TOWN_OR_CITY_MIN_MAX_LENGTH,
  townOrCityInvalidCharacters:
    CLIENT_DETAILS_ERROR.CORRESPONDENCE_TOWN_OR_CITY_INVALID_CHARACTERS,
  countyMinMax: CLIENT_DETAILS_ERROR.CORRESPONDENCE_COUNTY_MIN_MAX_LENGTH,
  countyInvalidCharacters:
    CLIENT_DETAILS_ERROR.CORRESPONDENCE_COUNTY_INVALID_CHARACTERS,
  postcodeMissing: CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_POSTCODE,
  postcodeMinMax: CLIENT_DETAILS_ERROR.CORRESPONDENCE_POSTCODE_MIN_MAX_LENGTH,
  postcodeInvalidCharacters:
    CLIENT_DETAILS_ERROR.CORRESPONDENCE_POSTCODE_INVALID_CHARACTERS,
};

export class ClientDetailsValidator extends FormValidator {
  validateClientDob(
    formBody: Partial<ClientDetailsFormData>,
  ): Partial<ClientNameDobError> {
    const errorSummaries: Partial<ClientNameDobError> = {};
    const {
      "dob-day": dateOfBirthDay,
      "dob-month": dateOfBirthMonth,
      "dob-year": dateOfBirthYear,
    } = formBody;

    const isDateEmpty = this.checkDateFieldsAreEmpty(
      dateOfBirthDay,
      dateOfBirthMonth,
      dateOfBirthYear,
    );
    const isDateNaN = this.checkDateIsNotANumber(
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

    if (this.validateFormInputValue(firstName)) {
      errorSummaries.firstNameInputError = {
        text: CLIENT_DETAILS_ERROR.MISSING_FIRST_NAME,
      };
    }

    if (this.validateFormInputValue(firstName, false)) {
      errorSummaries.firstNameInputError = {
        text: CLIENT_DETAILS_ERROR.FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
      };
    }

    if (this.validateFormInputValue(lastName)) {
      errorSummaries.lastNameInputError = {
        text: CLIENT_DETAILS_ERROR.MISSING_LAST_NAME,
      };
    }

    if (this.validateFormInputValue(lastName, false)) {
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
      this.validateFormInputValue(lastNameAtBirth)
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

    const { "has-nino": hasNino, "nino-input": ninoInput } = formBody;

    if (typeof hasNino !== "string") {
      errorSummaries.noRadioSelected = {
        text: CLIENT_DETAILS_ERROR.INPUT_NOT_SELECTED,
      };
    }

    if (
      typeof hasNino === "string" &&
      hasNino === "true" &&
      this.validateFormInputValue(ninoInput)
    ) {
      errorSummaries.ninoInputError = {
        text: CLIENT_DETAILS_ERROR.MISSING_NINO,
      };
    } else if (
      typeof hasNino === "string" &&
      hasNino === "true" &&
      typeof ninoInput === "string" &&
      !NINO_REGEX.test(ninoInput)
    ) {
      errorSummaries.ninoInputError = {
        text: CLIENT_DETAILS_ERROR.INVALID_NINO,
      };
    }

    return errorSummaries;
  }

  validatePrevApplicationReference(
    formBody: Partial<ClientDetailsFormData>,
  ): Partial<ClientPrevApplicationRefError> {
    const errorSummaries: Partial<ClientPrevApplicationRefError> = {};
    const {
      "has-prev-application": hasPrevApplication,
      "prev-laa-reference-input": prevApplicationRef,
    } = formBody;

    if (typeof hasPrevApplication !== "string") {
      errorSummaries.noRadioSelected = {
        text: CLIENT_DETAILS_ERROR.INPUT_NOT_SELECTED,
      };
    }

    if (
      typeof hasPrevApplication === "string" &&
      hasPrevApplication === "true" &&
      this.validateFormInputValue(prevApplicationRef)
    ) {
      errorSummaries.referenceInputError = {
        text: CLIENT_DETAILS_ERROR.MISSING_PREV_APPLICATION_REF,
      };
    }

    const MAX_REF_LENGTH = 35;
    if (
      typeof hasPrevApplication === "string" &&
      hasPrevApplication === "true" &&
      this.exceedsMaxLength(prevApplicationRef, MAX_REF_LENGTH)
    ) {
      errorSummaries.referenceInputError = {
        text: CLIENT_DETAILS_ERROR.APPLICATION_REFERENCE_EXCEEDS_MAX_CHARACTER_LENGTH,
      };
    }
    return errorSummaries;
  }

  validateHomeAddress(
    formBody: Partial<ClientDetailsFormData>,
  ): Partial<ClientHomeAddressError> {
    const {
      "home-address-line-1": addressLine1,
      "home-address-line-2": addressLine2,
      "home-town-or-city": townOrCity,
      "home-county": county,
      "home-postcode": postcode,
    } = formBody;

    return validateAddressFields(
      {
        addressLine1,
        addressLine2,
        townOrCity,
        county,
        postcode,
      },
      HOME_ADDRESS_VALIDATION_MESSAGES,
    );
  }

  validateCorrespondenceAddressSource(
    formBody: Partial<ClientDetailsFormData>,
    hasNoFixedAbode: boolean,
  ): Partial<ClientCorrespondenceAddressSourceError> {
    const errorSummaries: Partial<ClientCorrespondenceAddressSourceError> = {};

    const { "correspondence-address-source": correspondenceAddressSource } =
      formBody;

    if (typeof correspondenceAddressSource !== "string") {
      errorSummaries.noRadioSelected = {
        text: CLIENT_DETAILS_ERROR.INPUT_NOT_SELECTED,
      };
      return errorSummaries;
    }

    if (
      correspondenceAddressSource ===
        CORRESPONDENCE_ADDRESS_SOURCE.USE_CLIENT_HOME_ADDRESS &&
      hasNoFixedAbode
    ) {
      errorSummaries.noRadioSelected = {
        text: CLIENT_DETAILS_ERROR.INVALID_CORRESPONDENCE_SOURCE_FOR_NO_FIXED_ABODE,
      };
    }

    return errorSummaries;
  }

  validateCorrespondenceAddress(
    formBody: Partial<ClientDetailsFormData>,
  ): Partial<ClientHomeAddressError> {
    const {
      "correspondence-address-line-1": addressLine1,
      "correspondence-address-line-2": addressLine2,
      "correspondence-town-or-city": townOrCity,
      "correspondence-county": county,
      "correspondence-postcode": postcode,
    } = formBody;

    return validateAddressFields(
      {
        addressLine1,
        addressLine2,
        townOrCity,
        county,
        postcode,
      },
      CORRESPONDENCE_ADDRESS_VALIDATION_MESSAGES,
      { townOrCityMaxLength: CORRESPONDENCE_TOWN_OR_CITY_MAX_LENGTH },
    );
  }

  validateCorrespondenceRecipient(
    formBody: Partial<ClientDetailsFormData>,
  ): Partial<ClientCorrespondenceRecipientError> {
    const errorSummaries: Partial<ClientCorrespondenceRecipientError> = {};
    const {
      "correspondence-recipient": correspondenceRecipient,
      "correspondence-recipient-person-name": personName,
      "correspondence-recipient-organisation-name": organisationName,
    } = formBody;

    if (typeof correspondenceRecipient !== "string") {
      errorSummaries.noRadioSelected = {
        text: CLIENT_DETAILS_ERROR.INPUT_NOT_SELECTED,
      };
      return errorSummaries;
    }

    if (correspondenceRecipient === CORRESPONDENCE_RECIPIENT_TYPE.PERSON) {
      const personNameError =
        this.#validateCorrespondenceRecipientPersonName(personName);
      if (personNameError !== undefined) {
        errorSummaries.recipientPersonNameInputError = {
          text: personNameError,
        };
        return errorSummaries;
      }
    }

    if (
      correspondenceRecipient === CORRESPONDENCE_RECIPIENT_TYPE.ORGANISATION
    ) {
      const organisationNameError =
        this.#validateCorrespondenceRecipientOrganisationName(organisationName);
      if (organisationNameError !== undefined) {
        errorSummaries.recipientOrganisationNameInputError = {
          text: organisationNameError,
        };
        return errorSummaries;
      }
    }

    return errorSummaries;
  }

  #validateCorrespondenceRecipientPersonName(
    personName: string | undefined,
  ): string | undefined {
    if (this.validateFormInputValue(personName)) {
      return CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_RECIPIENT_PERSON_NAME;
    }

    if (this.validateFormInputValue(personName, false)) {
      return CLIENT_DETAILS_ERROR.CORRESPONDENCE_RECIPIENT_PERSON_NAME_EXCEEDS_MAX_CHARACTER_LENGTH;
    }

    if (
      typeof personName === "string" &&
      !CORRESPONDENCE_RECIPIENT_ALLOWED_CHARACTERS_REGEX.test(personName)
    ) {
      return CLIENT_DETAILS_ERROR.CORRESPONDENCE_RECIPIENT_PERSON_NAME_INVALID_CHARACTERS;
    }

    return undefined;
  }

  #validateCorrespondenceRecipientOrganisationName(
    organisationName: string | undefined,
  ): string | undefined {
    if (this.validateFormInputValue(organisationName)) {
      return CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_RECIPIENT_ORGANISATION_NAME;
    }

    if (this.validateFormInputValue(organisationName, false)) {
      return CLIENT_DETAILS_ERROR.CORRESPONDENCE_RECIPIENT_ORGANISATION_NAME_EXCEEDS_MAX_CHARACTER_LENGTH;
    }

    if (
      typeof organisationName === "string" &&
      !CORRESPONDENCE_RECIPIENT_ALLOWED_CHARACTERS_REGEX.test(organisationName)
    ) {
      return CLIENT_DETAILS_ERROR.CORRESPONDENCE_RECIPIENT_ORGANISATION_NAME_INVALID_CHARACTERS;
    }

    return undefined;
  }
}
