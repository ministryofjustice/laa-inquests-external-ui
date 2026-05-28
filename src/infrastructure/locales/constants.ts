export const MAX_CHARACTER_LENGTH = 100;

export const DECEASED_RELATIONSHIP_MAX_CHARACTER_LENGTH = 70;

export const DECEASED_CORONER_REFERENCE_MAX_CHARACTER_LENGTH = 50;

export const DECEASED_FURTHER_INFORMATION_MIN_CHARACTER_LENGTH = 2;

export const DECEASED_FURTHER_INFORMATION_MAX_CHARACTER_LENGTH = 500;

export const DATE_MONTH_INDEX_OFFSET = 1;

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
  MISSING_FIRST_NAME: "Enter your first name",
  MISSING_LAST_NAME: "Enter your last name",
  FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH:
    "First name must be 100 characters or less",
  LAST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH:
    "Last name must be 100 characters or less",
  MISSING_DATE_OF_DEATH_INPUT: "Please enter date of death",
  NON_NUMERIC_DATE_OF_DEATH:
    "Please enter date of death in the format expected",
  FUTURE_DATE_OF_DEATH: "Date of death must not be in the future",
  MISSING_DATE_OF_BIRTH_INPUT: "Please enter date of birth",
  NON_NUMERIC_DATE_OF_BIRTH:
    "Please enter date of birth in the format expected",
  FUTURE_DATE_OF_BIRTH: "Date of birth must not be in the future",
  INVALID_DATE: "Please enter a valid date",
  RELATIONSHIP_SELECTION_REQUIRED: "Please select an option",
  RELATIONSHIP_NOT_ELIGIBLE:
    "Your client needs to meet the definition of family member to qualify for legal aid",
  RELATIONSHIP_REQUIRED_MIN_MAX:
    "Relationship to deceased must be a maximum of 70 characters and a minimum of 1.",
  RELATIONSHIP_EXCEEDS_MAX_CHARACTER_LENGTH:
    "Relationship must be 70 characters or less",
  CORONER_REFERENCE_EXCEEDS_MAX_CHARACTER_LENGTH:
    "Coroner reference must be 50 characters or less",
  FURTHER_INFORMATION_SELECTION_REQUIRED: "Please select an option",
  FURTHER_INFORMATION_MIN_MAX:
    "Linked case details must be between 2 and 500 characters",
};

export const DECEASED_NAME_PAGE = {
  HEADING: "What is the name of the deceased?",
  FORM_PATH: "/apply/deceased-details/name",
  BACK_PATH: "/apply/proceedings",
  NEXT_PATH: "apply/deceased-details/dod",
  FIRST_NAME_LABEL: "First name",
  LAST_NAME_LABEL: "Last name",
};

export const PROCEEDING_ERROR = {
  NO_PROCEEDING_SPECIFIED:
    "An application must specify at least one related proceeding.",
  NO_CONFIRMATION_SPECIFIED: "Please select either yes or no to continue.",
  NO_PROCEEDINGS_IN_LIST: "A case must have a minimum of 1 proceeding",
};

export const NINO_REGEX =
  /^(?!BG)(?!GB)(?!NK)(?!KN)(?!TN)(?!NT)(?!ZZ)[A-CEG-HJ-TW-Z]{2}\s*[0-9]{6}\s*[A-D]{1}/iv;

export const PROCEEDING_OPTIONS = [
  {
    proceedingId: "PC049",
    proceedingDescription: "CAPA",
    matterType: "INQUEST",
  },
  {
    proceedingId: "MN035",
    proceedingDescription: "Clinical Negligence",
    matterType: "INQUEST",
  },
  {
    proceedingId: "MN036",
    proceedingDescription: "Death in Custody - Clinical Negligence",
    matterType: "INQUEST",
  },
  {
    proceedingId: "MH028",
    proceedingDescription: "Mental Health",
    matterType: "INQUEST",
  },
  {
    proceedingId: "MH030",
    proceedingDescription: "Death in Detention - Mental Health",
    matterType: "INQUEST",
  },
  {
    proceedingId: "IQ001",
    proceedingDescription: "Death in Custody",
    matterType: "INQUEST",
  },
  {
    proceedingId: "IQ002",
    proceedingDescription: "Inquest",
    matterType: "INQUEST",
  },
  {
    proceedingId: "IQ003",
    proceedingDescription: "Schedule 6 Town & Country Planning Act 1990",
    matterType: "INQUEST",
  },
  {
    proceedingId: "IQ004",
    proceedingDescription: "Public Inquiry s1 Inquiries Act 2005",
    matterType: "INQUEST",
  },
  {
    proceedingId: "IQ010",
    proceedingDescription: "S13 Coroner’s Act 1988 - Public Law",
    matterType: "INQUEST",
  },
];

export const PUBLIC_AUTHORITY_OPTIONS = [
  {
    publicAuthorityId: "prime-ministers-office-10-downing-street",
    publicAuthorityDescription: "Prime Minister's Office 10 Downing Street",
  },
  {
    publicAuthorityId: "cabinet-office",
    publicAuthorityDescription: "Cabinet Office",
  },
  {
    publicAuthorityId: "attorney-generals-office",
    publicAuthorityDescription: "Attorney General's Office",
  },
  {
    publicAuthorityId: "department-for-business-and-trade",
    publicAuthorityDescription: "Department for Business & Trade",
  },
  {
    publicAuthorityId: "department-for-culture-media-and-sport",
    publicAuthorityDescription: "Department for Culture, Media & Sport",
  },
  {
    publicAuthorityId: "department-for-education",
    publicAuthorityDescription: "Department for Education",
  },
  {
    publicAuthorityId: "department-for-energy-security-and-net-zero",
    publicAuthorityDescription: "Department for Energy Security & Net Zero",
  },
  {
    publicAuthorityId: "department-for-environment-food-and-rural-affairs",
    publicAuthorityDescription:
      "Department for Environment, Food & Rural Affairs",
  },
  {
    publicAuthorityId: "department-for-science-innovation-and-technology",
    publicAuthorityDescription:
      "Department for Science, Innovation & Technology",
  },
  {
    publicAuthorityId: "department-for-transport",
    publicAuthorityDescription: "Department for Transport",
  },
  {
    publicAuthorityId: "department-for-work-and-pensions",
    publicAuthorityDescription: "Department for Work & Pensions",
  },
  {
    publicAuthorityId: "department-of-health-and-social-care",
    publicAuthorityDescription: "Department of Health & Social Care",
  },
];

export const PUBLIC_AUTHORITY_ERROR = {
  NO_SELECTION: "Please select a public authority",
};

export const CLIENT_DECLARATION_ERROR = {
  NO_CONFIRMATION:
    "You need to confirm the declaration to submit this application",
};

export const HTTP_CREATED = 201;
