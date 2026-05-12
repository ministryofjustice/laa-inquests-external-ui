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

export interface DeceasedDateOfDeathError {
  dateOfDeathInputError?: FormErrorMessage;
}
