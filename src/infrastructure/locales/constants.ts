export const MAX_CHARACTER_LENGTH = 100;

export const CASE_SEARCH_ERROR = {
  MISSING_CASE_REFERENCE: "Case reference is required",
  NO_RESULTS: "There are no results that match the search criteria",
};

export const CLAIM_TYPE_ERROR = {
  MISSING_CLAIM_TYPE: "Please select a claim type",
  MISSING_CLAIM_SUBTYPE: "Please select a Payment on Account claim type",
};

export const TOTAL_CLAIM_ERROR = {
  MISSING_TOTAL_CLAIM_COST:
    "Please complete the total value of your claim to continue",
  INVALID_ZERO_VAT_TOTAL:
    "Total for costs charged at 0% VAT must be a valid amount with up to 2 decimal places",
  INVALID_NET_TOTAL:
    "Net total excluding VAT must be a valid amount with up to 2 decimal places",
  INVALID_GROSS_TOTAL:
    "Gross total of claim including VAT must be a valid amount with up to 2 decimal places",
  MISSING_GROSS_TOTAL_WHEN_NET_ENTERED:
    "Please complete the gross total value of your claim",
  PROFIT_COST_MIXED_VAT:
    "You cannot submit a profit cost claim with both 0% and 20% VAT",
  NET_TOTAL_HIGHER_THAN_GROSS_TOTAL:
    "Net total cannot be higher than the gross total value",
};

export const CLAIM_TYPE_VALUE = {
  PAYMENT_ON_ACCOUNT: "PAYMENT_ON_ACCOUNT",
  NIL_BILL: "NIL_BILL",
  FINAL_BILL: "FINAL_BILL",
};

export const CLAIM_TYPE_LABEL: Record<string, string> = {
  PAYMENT_ON_ACCOUNT: "Payment on account (POA)",
  NIL_BILL: "Nil bill",
  FINAL_BILL: "Final bill",
};

export const CLAIM_SUBTYPE_LABEL: Record<string, string> = {
  PROFIT_COST: "Profit cost",
  EXPERT_COST: "Expert cost",
  NON_EXPERT_DISBURSEMENT: "Non-expert disbursement",
};

export const SUBMIT_CLAIM_FALLBACK_ERROR =
  "Your claim could not be submitted. Please check your answers and try again.";

export const CLAIM_NET_TOTAL_VALUE = 1000;
export const CLAIM_GROSS_TOTAL_VALUE = 1200;

export const CONFIRM_CLAIM_PLACEHOLDER = {
  NET_TOTAL_VALUE: CLAIM_NET_TOTAL_VALUE,
  GROSS_TOTAL_VALUE: CLAIM_GROSS_TOTAL_VALUE,
  UPLOADED_FILES: [
    { name: "evidence-document-1.png", type: "png", size: "57KB" },
    { name: "evidence-document-2.pdf", type: "pdf", size: "112KB" },
  ],
};

export const DECEASED_RELATIONSHIP_MAX_CHARACTER_LENGTH = 70;

export const DECEASED_CORONER_REFERENCE_MAX_CHARACTER_LENGTH = 50;

export const DECEASED_FURTHER_INFORMATION_MIN_CHARACTER_LENGTH = 2;

export const DECEASED_FURTHER_INFORMATION_MAX_CHARACTER_LENGTH = 500;

export const HOME_ADDRESS_MIN_LENGTH = 2;

export const HOME_ADDRESS_MAX_LENGTH = 100;

export const HOME_TOWN_OR_CITY_MAX_LENGTH = 100;

export const HOME_COUNTY_MIN_LENGTH = 3;

export const HOME_COUNTY_MAX_LENGTH = 50;

export const HOME_POSTCODE_MIN_LENGTH = 5;

export const HOME_POSTCODE_MAX_LENGTH = 8;

export const CORRESPONDENCE_TOWN_OR_CITY_MAX_LENGTH = 100;

export const HOME_ADDRESS_ALLOWED_CHARACTERS_REGEX =
  /^(?:[A-Z0-9\s'.,\/\-]|&)+$/iv;

export const HOME_TOWN_OR_CITY_ALLOWED_CHARACTERS_REGEX = /^[A-Z\s\-']+$/iv;

export const HOME_POSTCODE_ALLOWED_CHARACTERS_REGEX = /^[A-Z0-9\s]+$/iv;

export const CORRESPONDENCE_RECIPIENT_ALLOWED_CHARACTERS_REGEX =
  /^(?:[\p{L}\p{N}\s'.,\-]|&)+$/v;

export const ALPHANUMERIC_CHARACTER_REGEX = /[A-Z0-9]/iv;

export const DATE_MONTH_INDEX_OFFSET = 1;

export const EMPTY_ARR_LENGTH = 0;

export const CLIENT_DETAILS_ERROR = {
  INVALID_DATE: "Please enter a valid date",
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
  MISSING_HOME_ADDRESS_LINE_1: "Please enter address line 1",
  HOME_ADDRESS_LINE_1_MIN_MAX_LENGTH:
    "Address line 1 must be between 2 and 100 characters",
  HOME_ADDRESS_LINE_1_REQUIRES_ALPHANUMERIC_CHARACTER:
    "Address line 1 must include at least 1 letter or number",
  HOME_ADDRESS_LINE_1_INVALID_CHARACTERS:
    "Address line 1 must only include letters, numbers, spaces, hyphens, apostrophes, commas, full stops, forward slashes and ampersands",
  HOME_ADDRESS_LINE_2_MIN_MAX_LENGTH:
    "Address line 2 must be between 2 and 100 characters",
  HOME_ADDRESS_LINE_2_REQUIRES_ALPHANUMERIC_CHARACTER:
    "Address line 2 must include at least 1 letter or number",
  HOME_ADDRESS_LINE_2_INVALID_CHARACTERS:
    "Address line 2 must only include letters, numbers, spaces, hyphens, apostrophes, commas, full stops, forward slashes and ampersands",
  MISSING_HOME_TOWN_OR_CITY: "Please enter town or city",
  HOME_TOWN_OR_CITY_MIN_MAX_LENGTH:
    "Town or city must be between 2 and 100 characters",
  HOME_TOWN_OR_CITY_INVALID_CHARACTERS:
    "Town or city must only include letters, spaces, hyphens and apostrophes",
  HOME_COUNTY_MIN_MAX_LENGTH: "County must be between 3 and 50 characters",
  HOME_COUNTY_INVALID_CHARACTERS:
    "County must only include letters, spaces, hyphens and apostrophes",
  MISSING_HOME_POSTCODE: "Please enter postcode",
  HOME_POSTCODE_MIN_MAX_LENGTH: "Postcode must be between 5 and 8 characters",
  HOME_POSTCODE_INVALID_CHARACTERS:
    "Postcode must only include letters, numbers and spaces",
  INVALID_HOME_POSTCODE: "Please enter a valid UK postcode",
  INVALID_CORRESPONDENCE_SOURCE_FOR_NO_FIXED_ABODE:
    "You cannot select your client's UK home address when they have no fixed abode",
  MISSING_CORRESPONDENCE_ADDRESS_LINE_1: "Please enter address line 1",
  CORRESPONDENCE_ADDRESS_LINE_1_MIN_MAX_LENGTH:
    "Address line 1 must be between 2 and 100 characters",
  CORRESPONDENCE_ADDRESS_LINE_1_REQUIRES_ALPHANUMERIC_CHARACTER:
    "Address line 1 must include at least 1 letter or number",
  CORRESPONDENCE_ADDRESS_LINE_1_INVALID_CHARACTERS:
    "Address line 1 must only include letters, numbers, spaces, hyphens, apostrophes, commas, full stops, forward slashes and ampersands",
  CORRESPONDENCE_ADDRESS_LINE_2_MIN_MAX_LENGTH:
    "Address line 2 must be between 2 and 100 characters",
  CORRESPONDENCE_ADDRESS_LINE_2_REQUIRES_ALPHANUMERIC_CHARACTER:
    "Address line 2 must include at least 1 letter or number",
  CORRESPONDENCE_ADDRESS_LINE_2_INVALID_CHARACTERS:
    "Address line 2 must only include letters, numbers, spaces, hyphens, apostrophes, commas, full stops, forward slashes and ampersands",
  MISSING_CORRESPONDENCE_TOWN_OR_CITY: "Please enter town or city",
  CORRESPONDENCE_TOWN_OR_CITY_MIN_MAX_LENGTH:
    "Town or city must be between 2 and 100 characters",
  CORRESPONDENCE_TOWN_OR_CITY_INVALID_CHARACTERS:
    "Town or city must only include letters, spaces, hyphens and apostrophes",
  CORRESPONDENCE_COUNTY_MIN_MAX_LENGTH:
    "County must be between 3 and 50 characters",
  CORRESPONDENCE_COUNTY_INVALID_CHARACTERS:
    "County must only include letters, spaces, hyphens and apostrophes",
  MISSING_CORRESPONDENCE_POSTCODE: "Please enter postcode",
  CORRESPONDENCE_POSTCODE_MIN_MAX_LENGTH:
    "Postcode must be between 5 and 8 characters",
  CORRESPONDENCE_POSTCODE_INVALID_CHARACTERS:
    "Postcode must only include letters, numbers and spaces",
  INVALID_CORRESPONDENCE_POSTCODE: "Please enter a valid UK postcode",
  MISSING_CORRESPONDENCE_RECIPIENT_PERSON_NAME:
    "Please enter the person's name",
  CORRESPONDENCE_RECIPIENT_PERSON_NAME_EXCEEDS_MAX_CHARACTER_LENGTH:
    "Person's name must be 100 characters or less",
  CORRESPONDENCE_RECIPIENT_PERSON_NAME_INVALID_CHARACTERS:
    "Person's name must only include letters, numbers, spaces, apostrophes, commas, full stops, hyphens and ampersands",
  MISSING_CORRESPONDENCE_RECIPIENT_ORGANISATION_NAME:
    "Please enter the organisation name",
  CORRESPONDENCE_RECIPIENT_ORGANISATION_NAME_EXCEEDS_MAX_CHARACTER_LENGTH:
    "Organisation name must be 100 characters or less",
  CORRESPONDENCE_RECIPIENT_ORGANISATION_NAME_INVALID_CHARACTERS:
    "Organisation name must only include letters, numbers, spaces, apostrophes, commas, full stops, hyphens and ampersands",
};

export const CORRESPONDENCE_ADDRESS_SOURCE = {
  USE_CLIENT_HOME_ADDRESS: "USE_CLIENT_HOME_ADDRESS",
  USE_SPECIFIED_ADDRESS: "USE_SPECIFIED_ADDRESS",
  USE_PROVIDER_ADDRESS: "USE_PROVIDER_ADDRESS",
} as const;

export const CORRESPONDENCE_RECIPIENT_TYPE = {
  PERSON: "PERSON",
  ORGANISATION: "ORGANISATION",
} as const;

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

export const UK_POSTCODE_REGEX =
  /^(GIR\s?0AA|[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})$/iv;

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

export const PUBLIC_AUTHORITY_SUCCESS = {
  REMOVED: "Public authority has been removed",
};

export const CORONERS_LETTER_ERROR = {
  NO_FILE_CHOSEN: "Select a file",
  FILE_TOO_LARGE: "The selected file must be smaller than 10MB",
  FILE_IS_EMPTY: "The selected file is empty",
  INVALID_FILE_TYPE: "The selected file must be a JPG, PNG, BMP or PDF",
  FILE_SCAN_FOUND_VIRUS: "The selected file contains a virus",
};

export const CORONERS_LETTER_MAX_FILE_SIZE_BYTES = 10485760; // 10 * 1024 * 1024 (10MB)
export const CORONERS_LETTER_TOO_SMALL_FILE_SIZE_BYTES = 0;

export const CORONERS_LETTER_ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/bmp",
  "application/pdf",
];

export const CLIENT_DECLARATION_ERROR = {
  NO_CONFIRMATION:
    "You need to confirm the declaration to submit this application",
};

export const HTTP_CREATED = 201;
export const HTTP_UNPROCESSABLE_CONTENT = 422;
