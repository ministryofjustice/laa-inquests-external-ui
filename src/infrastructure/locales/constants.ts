export const MAX_CHARACTER_LENGTH = 100;

export const EMPTY_ARR_LENGTH = 0;

export const CLIENT_DETAILS_ERROR = {
  NON_NUMERIC_DATE: "Please enter date of birth in the format expected",
  MISSING_DOB_INPUT: "Please enter date of birth",
  FUTURE_DATE: "Date of birth must not be in the future",
  FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH:
    "First name(s) cannot exceed 100 characters",
  LAST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH:
    "Last name cannot exceed 100 characters",
  MISSING_FIRST_NAME: "Please enter your client's first name",
  MISSING_LAST_NAME: "Please enter your client's last name",
  MISSING_LAST_NAME_AT_BIRTH: "Please enter the client's birth name",
  INPUT_NOT_SELECTED: "Please select an option",
  MISSING_NINO: "You must enter the client's National Insurance Number",
  INVALID_NINO: "You must enter a valid National Insurance Number",
  APPLICATION_REFERENCE_EXCEEDS_MAX_CHARACTER_LENGTH:
    "Application cannot exceed 35 characters",
  MISSING_PREV_APPLICATION_REF:
    "Please enter the reference for the previous application.",
};

export const DECEASED_DETAILS_ERROR = {
  MISSING_FIRST_NAME: "Please enter the first name of the deceased",
  MISSING_LAST_NAME: "Please enter the last name of the deceased",
  FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH:
    "First name(s) cannot exceed 100 characters",
  LAST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH:
    "Last name cannot exceed 100 characters",
};

export const PROCEEDING_ERROR = {
  NO_PROCEEDING_SPECIFIED:
    "An application must specify at least one related proceeding.",
  NO_CONFIRMATION_SPECIFIED: "Please select either yes or no to continue.",
};

export const NINO_REGEX =
  /^(?!BG)(?!GB)(?!NK)(?!KN)(?!TN)(?!NT)(?!ZZ)[A-CEG-HJ-TW-Z]{2}\s*[0-9]{6}\s*[A-D]{1}/iv;

export const PROCEEDING_OPTIONS = [
  "CAPA",
  "Clinical Negligence",
  "Death in Custody - Clinical Negligence",
  "Mental Health",
  "Death in Detention - Mental Health",
  "Death in Custody",
  "Schedule 6 Town & Country Planning Act 1990",
  "Public Inquiry s1 Inquiries Act 2005",
  "S13 Coroner’s Act 1988 - Public Law",
];
