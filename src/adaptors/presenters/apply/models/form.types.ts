export interface ClientDetailsFormData {
  "first-name": string;
  "last-name": string;
  "last-name-at-birth": string;
  "name-change": string | undefined;
  "has-nino": string;
  "nino-input": string;
  "has-prev-application": string;
  "prev-laa-reference-input": string;
}

export interface FormErrorMessage {
  text: string;
  href?: string;
}

export interface ClientNameDobError {
  noFirstNameProvided?: FormErrorMessage;
  noLastNameProvided?: FormErrorMessage;
  maxFirstNameCharacterLengthExceeded?: FormErrorMessage;
  maxLastNameCharacterLengthExceeded?: FormErrorMessage;
  noRadioSelected?: FormErrorMessage;
  noBirthNameSpecified?: FormErrorMessage;
}
