export interface FormBody {
  _csrf: string;
}
export interface ClientDetailsFormData extends FormBody {
  "first-name": string;
  "last-name": string;
  "last-name-at-birth": string;
  "name-change": string | undefined;
  "has-nino": string;
  "nino-input": string;
  "home-address-line-1": string;
  "home-address-line-2": string;
  "home-town-or-city": string;
  "home-county": string;
  "home-postcode": string;
  "has-no-fixed-abode": string;
  "correspondence-address-source": string;
  "correspondence-address-line-1": string;
  "correspondence-address-line-2": string;
  "correspondence-town-or-city": string;
  "correspondence-county": string;
  "correspondence-postcode": string;
  "correspondence-recipient": string;
  "correspondence-recipient-person-name": string;
  "correspondence-recipient-organisation-name": string;
  "has-prev-application": string;
  "prev-laa-reference-input": string;
  "dob-day": string;
  "dob-month": string;
  "dob-year": string;
}

export interface FormErrorMessage {
  text: string;
  href?: string;
}

export interface ClientNameDobError {
  firstNameInputError?: FormErrorMessage;
  lastNameInputError?: FormErrorMessage;
  noRadioSelected?: FormErrorMessage;
  noBirthNameSpecified?: FormErrorMessage;
  dobInputError?: FormErrorMessage;
}

export interface ClientNinoError {
  noRadioSelected?: FormErrorMessage;
  ninoInputError?: FormErrorMessage;
}

export interface ClientPrevApplicationRefError {
  noRadioSelected?: FormErrorMessage;
  referenceInputError?: FormErrorMessage;
}

export interface ClientHomeAddressError {
  addressLine1InputError?: FormErrorMessage;
  addressLine2InputError?: FormErrorMessage;
  townOrCityInputError?: FormErrorMessage;
  countyInputError?: FormErrorMessage;
  postcodeInputError?: FormErrorMessage;
}

export interface ClientCorrespondenceAddressSourceError {
  noRadioSelected?: FormErrorMessage;
}

export interface ClientCorrespondenceRecipientError {
  noRadioSelected?: FormErrorMessage;
  recipientPersonNameInputError?: FormErrorMessage;
  recipientOrganisationNameInputError?: FormErrorMessage;
}

export interface ClientDeclarationFormData extends FormBody {
  "client-declaration-confirmation"?: string | string[];
}

export interface ClientDeclarationError {
  noDeclarationConfirmation?: FormErrorMessage;
}

export interface DeceasedDetailsFormData extends FormBody {
  "deceased-first-name": string;
  "deceased-last-name": string;
  "deceased-date-of-death-day": string;
  "deceased-date-of-death-month": string;
  "deceased-date-of-death-year": string;
  "deceased-date-of-birth-day": string;
  "deceased-date-of-birth-month": string;
  "deceased-date-of-birth-year": string;
  "deceased-has-client-relationship": string;
  "deceased-client-relationship": string;
  "deceased-coroner-reference": string;
  "deceased-has-further-information": string;
  "deceased-further-information": string;
}

export interface DeceasedNameError {
  firstNameInputError?: FormErrorMessage;
  lastNameInputError?: FormErrorMessage;
}

export interface ProceedingsFormData extends FormBody {
  "proceeding-option": string;
  "add-another-proceeding": string;
}

export interface RemoveProceedingFormData extends FormBody {
  proceedingId: string;
  "remove-proceeding": string;
}

export interface ProceedingsError {
  noProceedingSelected?: FormErrorMessage;
  noConfirmationSelected?: FormErrorMessage;
  noProceedingsInList?: FormErrorMessage;
}

export interface Option {
  text: string;
  value: string;
}

export interface DeceasedDateOfDeathError {
  dateOfDeathInputError?: FormErrorMessage;
}

export type CorrespondenceAddressSourceValue =
  | "USE_CLIENT_HOME_ADDRESS"
  | "USE_SPECIFIED_ADDRESS"
  | "USE_PROVIDER_ADDRESS";

export type CorrespondenceRecipientSelectionValue =
  | "PERSON"
  | "ORGANISATION"
  | "NONE";
export interface DeceasedDateOfBirthError {
  dateOfBirthInputError?: FormErrorMessage;
}

export interface DeceasedClientRelationshipError {
  hasClientRelationshipInputError?: FormErrorMessage;
  clientRelationshipInputError?: FormErrorMessage;
}

export interface DeceasedCoronerReferenceError {
  coronerReferenceInputError?: FormErrorMessage;
}

export interface DeceasedFurtherInformationError {
  hasFurtherInformationInputError?: FormErrorMessage;
  furtherInformationInputError?: FormErrorMessage;
}

export interface UploadCoronersLetterError {
  coronersLetterError?: FormErrorMessage;
}
