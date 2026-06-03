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
  ALPHANUMERIC_CHARACTER_REGEX,
  CLIENT_DETAILS_ERROR,
  CORRESPONDENCE_ADDRESS_SOURCE,
  CORRESPONDENCE_RECIPIENT_TYPE,
  HOME_ADDRESS_ALLOWED_CHARACTERS_REGEX,
  HOME_ADDRESS_MAX_LENGTH,
  HOME_ADDRESS_MIN_LENGTH,
  HOME_COUNTY_MAX_LENGTH,
  HOME_COUNTY_MIN_LENGTH,
  HOME_POSTCODE_ALLOWED_CHARACTERS_REGEX,
  HOME_POSTCODE_MAX_LENGTH,
  HOME_POSTCODE_MIN_LENGTH,
  HOME_TOWN_OR_CITY_ALLOWED_CHARACTERS_REGEX,
  HOME_TOWN_OR_CITY_MAX_LENGTH,
  NINO_REGEX,
  UK_POSTCODE_REGEX,
} from "#src/infrastructure/locales/constants.js";
import { FormValidator } from "#src/utils/FormValidator.js";

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
    const errorSummaries: Partial<ClientHomeAddressError> = {};
    const {
      "home-address-line-1": addressLine1,
      "home-address-line-2": addressLine2,
      "home-town-or-city": townOrCity,
      "home-county": county,
      "home-postcode": postcode,
    } = formBody;

    const addressLine1Error = this.#validateHomeAddressLine1(addressLine1);
    const addressLine2Error = this.#validateHomeAddressLine2(addressLine2);
    const townOrCityError = this.#validateHomeTownOrCity(townOrCity);
    const countyError = this.#validateHomeCounty(county);
    const postcodeError = this.#validateHomePostcode(postcode);

    if (addressLine1Error !== undefined) {
      errorSummaries.addressLine1InputError = addressLine1Error;
    }

    if (addressLine2Error !== undefined) {
      errorSummaries.addressLine2InputError = addressLine2Error;
    }

    if (townOrCityError !== undefined) {
      errorSummaries.townOrCityInputError = townOrCityError;
    }

    if (countyError !== undefined) {
      errorSummaries.countyInputError = countyError;
    }

    if (postcodeError !== undefined) {
      errorSummaries.postcodeInputError = postcodeError;
    }

    return errorSummaries;
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
    const errorSummaries: Partial<ClientHomeAddressError> = {};
    const {
      "correspondence-address-line-1": addressLine1,
      "correspondence-town-or-city": townOrCity,
      "correspondence-postcode": postcode,
    } = formBody;

    if (this.validateFormInputValue(addressLine1)) {
      errorSummaries.addressLine1InputError = {
        text: CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_ADDRESS_LINE_1,
      };
    }

    if (this.validateFormInputValue(townOrCity)) {
      errorSummaries.townOrCityInputError = {
        text: CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_TOWN_OR_CITY,
      };
    }

    if (this.validateFormInputValue(postcode)) {
      errorSummaries.postcodeInputError = {
        text: CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_POSTCODE,
      };
    } else if (
      typeof postcode === "string" &&
      !UK_POSTCODE_REGEX.test(postcode)
    ) {
      errorSummaries.postcodeInputError = {
        text: CLIENT_DETAILS_ERROR.INVALID_CORRESPONDENCE_POSTCODE,
      };
    }

    return errorSummaries;
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

    if (
      correspondenceRecipient === CORRESPONDENCE_RECIPIENT_TYPE.PERSON &&
      this.validateFormInputValue(personName)
    ) {
      errorSummaries.recipientNameInputError = {
        text: CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_RECIPIENT_PERSON_NAME,
      };
      return errorSummaries;
    }

    if (
      correspondenceRecipient === CORRESPONDENCE_RECIPIENT_TYPE.ORGANISATION &&
      this.validateFormInputValue(organisationName)
    ) {
      errorSummaries.recipientNameInputError = {
        text: CLIENT_DETAILS_ERROR.MISSING_CORRESPONDENCE_RECIPIENT_ORGANISATION_NAME,
      };
    }

    return errorSummaries;
  }

  #hasValue(inputValue: string | undefined): inputValue is string {
    return typeof inputValue === "string" && inputValue !== "";
  }

  #validateHomeAddressLine1(
    inputValue: string | undefined,
  ): { text: string } | undefined {
    if (this.validateFormInputValue(inputValue)) {
      return { text: CLIENT_DETAILS_ERROR.MISSING_HOME_ADDRESS_LINE_1 };
    }

    if (
      this.validateMinMaxLength(
        inputValue,
        HOME_ADDRESS_MIN_LENGTH,
        HOME_ADDRESS_MAX_LENGTH,
      )
    ) {
      return { text: CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_1_MIN_MAX_LENGTH };
    }

    if (!this.#containsAlphanumericCharacter(inputValue)) {
      return {
        text: CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_1_REQUIRES_ALPHANUMERIC_CHARACTER,
      };
    }

    if (
      !this.#matchesPattern(inputValue, HOME_ADDRESS_ALLOWED_CHARACTERS_REGEX)
    ) {
      return {
        text: CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_1_INVALID_CHARACTERS,
      };
    }

    return undefined;
  }

  #validateHomeAddressLine2(
    inputValue: string | undefined,
  ): { text: string } | undefined {
    if (!this.#hasValue(inputValue)) {
      return undefined;
    }

    if (
      this.validateMinMaxLength(
        inputValue,
        HOME_ADDRESS_MIN_LENGTH,
        HOME_ADDRESS_MAX_LENGTH,
      )
    ) {
      return { text: CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_2_MIN_MAX_LENGTH };
    }

    if (!this.#containsAlphanumericCharacter(inputValue)) {
      return {
        text: CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_2_REQUIRES_ALPHANUMERIC_CHARACTER,
      };
    }

    if (
      !this.#matchesPattern(inputValue, HOME_ADDRESS_ALLOWED_CHARACTERS_REGEX)
    ) {
      return {
        text: CLIENT_DETAILS_ERROR.HOME_ADDRESS_LINE_2_INVALID_CHARACTERS,
      };
    }

    return undefined;
  }

  #validateHomeTownOrCity(
    inputValue: string | undefined,
  ): { text: string } | undefined {
    if (this.validateFormInputValue(inputValue)) {
      return { text: CLIENT_DETAILS_ERROR.MISSING_HOME_TOWN_OR_CITY };
    }

    if (
      this.validateMinMaxLength(
        inputValue,
        HOME_ADDRESS_MIN_LENGTH,
        HOME_TOWN_OR_CITY_MAX_LENGTH,
      )
    ) {
      return { text: CLIENT_DETAILS_ERROR.HOME_TOWN_OR_CITY_MIN_MAX_LENGTH };
    }

    if (
      !this.#matchesPattern(
        inputValue,
        HOME_TOWN_OR_CITY_ALLOWED_CHARACTERS_REGEX,
      )
    ) {
      return {
        text: CLIENT_DETAILS_ERROR.HOME_TOWN_OR_CITY_INVALID_CHARACTERS,
      };
    }

    return undefined;
  }

  #validateHomeCounty(
    inputValue: string | undefined,
  ): { text: string } | undefined {
    if (!this.#hasValue(inputValue)) {
      return undefined;
    }

    if (
      this.validateMinMaxLength(
        inputValue,
        HOME_COUNTY_MIN_LENGTH,
        HOME_COUNTY_MAX_LENGTH,
      )
    ) {
      return { text: CLIENT_DETAILS_ERROR.HOME_COUNTY_MIN_MAX_LENGTH };
    }

    if (
      !this.#matchesPattern(
        inputValue,
        HOME_TOWN_OR_CITY_ALLOWED_CHARACTERS_REGEX,
      )
    ) {
      return { text: CLIENT_DETAILS_ERROR.HOME_COUNTY_INVALID_CHARACTERS };
    }

    return undefined;
  }

  #validateHomePostcode(
    inputValue: string | undefined,
  ): { text: string } | undefined {
    if (this.validateFormInputValue(inputValue)) {
      return { text: CLIENT_DETAILS_ERROR.MISSING_HOME_POSTCODE };
    }

    if (
      this.validateMinMaxLength(
        inputValue,
        HOME_POSTCODE_MIN_LENGTH,
        HOME_POSTCODE_MAX_LENGTH,
      )
    ) {
      return { text: CLIENT_DETAILS_ERROR.HOME_POSTCODE_MIN_MAX_LENGTH };
    }

    if (
      !this.#matchesPattern(inputValue, HOME_POSTCODE_ALLOWED_CHARACTERS_REGEX)
    ) {
      return { text: CLIENT_DETAILS_ERROR.HOME_POSTCODE_INVALID_CHARACTERS };
    }

    return undefined;
  }

  #containsAlphanumericCharacter(inputValue: string | undefined): boolean {
    return (
      typeof inputValue === "string" &&
      ALPHANUMERIC_CHARACTER_REGEX.test(inputValue)
    );
  }

  #matchesPattern(inputValue: string | undefined, pattern: RegExp): boolean {
    return typeof inputValue === "string" && pattern.test(inputValue);
  }
}
