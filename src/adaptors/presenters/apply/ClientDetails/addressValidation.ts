import type { ClientHomeAddressError } from "#src/adaptors/presenters/apply/models/form.types.js";

const ADDRESS_MIN_LENGTH = 2;
const ADDRESS_MAX_LENGTH = 100;
const TOWN_OR_CITY_MAX_LENGTH = 50;
const COUNTY_MIN_LENGTH = 3;
const COUNTY_MAX_LENGTH = 50;
const POSTCODE_MIN_LENGTH = 5;
const POSTCODE_MAX_LENGTH = 8;

const ADDRESS_ALLOWED_CHARACTERS_REGEX = /^(?:[A-Z0-9\s'.,\/\-]|&)+$/iv;
const TOWN_OR_CITY_ALLOWED_CHARACTERS_REGEX = /^[A-Z\s\-']+$/iv;
const POSTCODE_ALLOWED_CHARACTERS_REGEX = /^[A-Z0-9\s]+$/iv;
const ALPHANUMERIC_CHARACTER_REGEX = /[A-Z0-9]/iv;

interface AddressValidationMessages {
  line1Missing: string;
  line1MinMax: string;
  line1RequiresAlphanumeric: string;
  line1InvalidCharacters: string;
  line2MinMax: string;
  line2RequiresAlphanumeric: string;
  line2InvalidCharacters: string;
  townOrCityMissing: string;
  townOrCityMinMax: string;
  townOrCityInvalidCharacters: string;
  countyMinMax: string;
  countyInvalidCharacters: string;
  postcodeMissing: string;
  postcodeMinMax: string;
  postcodeInvalidCharacters: string;
}

interface AddressValues {
  addressLine1: string | undefined;
  addressLine2: string | undefined;
  townOrCity: string | undefined;
  county: string | undefined;
  postcode: string | undefined;
}

function hasValue(inputValue: string | undefined): inputValue is string {
  return typeof inputValue === "string" && inputValue !== "";
}

function isMissing(inputValue: string | undefined): boolean {
  return !hasValue(inputValue);
}

function isOutsideLengthRange(
  inputValue: string | undefined,
  minLength: number,
  maxLength: number,
): boolean {
  return (
    typeof inputValue === "string" &&
    (inputValue.length < minLength || inputValue.length > maxLength)
  );
}

function hasAlphanumericCharacter(inputValue: string | undefined): boolean {
  return (
    typeof inputValue === "string" &&
    ALPHANUMERIC_CHARACTER_REGEX.test(inputValue)
  );
}

function matchesPattern(
  inputValue: string | undefined,
  pattern: RegExp,
): boolean {
  return typeof inputValue === "string" && pattern.test(inputValue);
}

function validateAddressLine1(
  values: AddressValues,
  messages: AddressValidationMessages,
): { text: string } | undefined {
  if (isMissing(values.addressLine1)) {
    return { text: messages.line1Missing };
  }

  if (
    isOutsideLengthRange(
      values.addressLine1,
      ADDRESS_MIN_LENGTH,
      ADDRESS_MAX_LENGTH,
    )
  ) {
    return { text: messages.line1MinMax };
  }

  if (!hasAlphanumericCharacter(values.addressLine1)) {
    return { text: messages.line1RequiresAlphanumeric };
  }

  if (!matchesPattern(values.addressLine1, ADDRESS_ALLOWED_CHARACTERS_REGEX)) {
    return { text: messages.line1InvalidCharacters };
  }

  return undefined;
}

function validateAddressLine2(
  values: AddressValues,
  messages: AddressValidationMessages,
): { text: string } | undefined {
  if (!hasValue(values.addressLine2)) {
    return undefined;
  }

  if (
    isOutsideLengthRange(
      values.addressLine2,
      ADDRESS_MIN_LENGTH,
      ADDRESS_MAX_LENGTH,
    )
  ) {
    return { text: messages.line2MinMax };
  }

  if (!hasAlphanumericCharacter(values.addressLine2)) {
    return { text: messages.line2RequiresAlphanumeric };
  }

  if (!matchesPattern(values.addressLine2, ADDRESS_ALLOWED_CHARACTERS_REGEX)) {
    return { text: messages.line2InvalidCharacters };
  }

  return undefined;
}

function validateTownOrCity(
  values: AddressValues,
  messages: AddressValidationMessages,
): { text: string } | undefined {
  if (isMissing(values.townOrCity)) {
    return { text: messages.townOrCityMissing };
  }

  if (
    isOutsideLengthRange(
      values.townOrCity,
      ADDRESS_MIN_LENGTH,
      TOWN_OR_CITY_MAX_LENGTH,
    )
  ) {
    return { text: messages.townOrCityMinMax };
  }

  if (
    !matchesPattern(values.townOrCity, TOWN_OR_CITY_ALLOWED_CHARACTERS_REGEX)
  ) {
    return { text: messages.townOrCityInvalidCharacters };
  }

  return undefined;
}

function validateCounty(
  values: AddressValues,
  messages: AddressValidationMessages,
): { text: string } | undefined {
  if (!hasValue(values.county)) {
    return undefined;
  }

  if (
    isOutsideLengthRange(values.county, COUNTY_MIN_LENGTH, COUNTY_MAX_LENGTH)
  ) {
    return { text: messages.countyMinMax };
  }

  if (!matchesPattern(values.county, TOWN_OR_CITY_ALLOWED_CHARACTERS_REGEX)) {
    return { text: messages.countyInvalidCharacters };
  }

  return undefined;
}

function validatePostcode(
  values: AddressValues,
  messages: AddressValidationMessages,
): { text: string } | undefined {
  if (isMissing(values.postcode)) {
    return { text: messages.postcodeMissing };
  }

  if (
    isOutsideLengthRange(
      values.postcode,
      POSTCODE_MIN_LENGTH,
      POSTCODE_MAX_LENGTH,
    )
  ) {
    return { text: messages.postcodeMinMax };
  }

  if (!matchesPattern(values.postcode, POSTCODE_ALLOWED_CHARACTERS_REGEX)) {
    return { text: messages.postcodeInvalidCharacters };
  }

  return undefined;
}

export function validateAddressFields(
  values: AddressValues,
  messages: AddressValidationMessages,
): Partial<ClientHomeAddressError> {
  const errorSummaries: Partial<ClientHomeAddressError> = {};
  const addressLine1Error = validateAddressLine1(values, messages);
  const addressLine2Error = validateAddressLine2(values, messages);
  const townOrCityError = validateTownOrCity(values, messages);
  const countyError = validateCounty(values, messages);
  const postcodeError = validatePostcode(values, messages);

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
