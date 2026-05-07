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
}

export interface DeceasedNameError {
  firstNameInputError?: FormErrorMessage;
  lastNameInputError?: FormErrorMessage;
}

export interface ProceedingsFormData extends FormBody {
  "proceeding-option": string;
  "add-another-proceeding": string;
}

export interface ProceedingsError {
  noProceedingSelected?: FormErrorMessage;
  noConfirmationSelected?: FormErrorMessage;
}
