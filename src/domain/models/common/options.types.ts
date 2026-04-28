export const applicationTypeOptions = ["INITIAL"];

export const categoryOfLawOptions = ["INQUESTS"];

export const certificateOptions = ["EMERGENCY"];

export const certificateStatusCodeOptions = ["CLOSED", "DISCHARGED", "REVOKED"];

export const clientInvolvementOptions = ["RESPONDENT"];

export const levelOfServiceOptions = ["FULL_REPRESENTATION"];

export const matterTypeOptions = ["INQUESTS_MATTER_TYPE"];

export const statusOptions = [
  "APPLICATION_SUBMITTED",
  "APPLICATION_IN_PROGRESS",
  "PARTIALLY_GRANTED",
  "REFUSED",
];

export const meansMeritsDecisionStateOptions = [
  "GRANTED",
  "PENDING",
  "REFUSED",
];

export const overallDecisionStateOptions = [
  ...meansMeritsDecisionStateOptions,
  "PARTIALLY_GRANTED",
];

export const inquestsProceedingTypeOptions = [
  "EXAMPLE_PROCEEDING_TYPE",
];

export const scopeLimitationHeadingOptions = ["FINAL_HEARING"];
