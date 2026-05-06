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
