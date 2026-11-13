// Journey sequences for apply and claim flows
// Logic is accessing any page url must have lastCompletedStep set to the index of the page directly below it
// Setting is handled by completeStepAndRedirect, which will res.redirect to a page whilst also calling markCompleteStep

export const APPLY_JOURNEY_SEQUENCE = [
  "/apply",
  "/apply/office-accounts",
  "/apply/client-details/name-and-dob",
  "/apply/client-details/nino",
  "/apply/client-details/has-prev-application",
  "/apply/client-details/home-address",
  "/apply/client-details/correspondence-address-source", // Can jump to either correspondence-address or correspondence-recipient
  "/apply/client-details/correspondence-address",
  "/apply/client-details/correspondence-recipient",
  "/apply/proceeding",
  "/apply/deceased-details/name",
  "/apply/deceased-details/dod",
  "/apply/deceased-details/dob",
  "/apply/deceased-details/client-relationship",
  "/apply/deceased-details/coroner-reference",
  "/apply/deceased-details/further-information",
  "/apply/public-authority",
  "/apply/upload-coroners-letter",
  "/apply/check-your-answers",
  "/apply/confirmation/client-declaration",
  "/apply/confirmation/success",
];

export const CLAIM_JOURNEY_SEQUENCE = [
  "/claim",
  "/claim/search",
  "/claim/results",
  "/claim/cannot-claim",
  "/claim/type", // claim type (POA/Final bill) (branching paths will continue to POA, or final bill sequence and meetup and check your answers)
  "/claim/subtype", // POA subtype
  "/claim/total-cost",
  "/claim/final-bill-template",
  "/claim/evidence",
  //Final Bill sequence
  "/claim/counsel-number",
  "/claim/counsel-pay-confirmation",
  "/claim/end-date",
  "/claim/inquest-outcome",
  "/claim/funding-post-inquest",
  "/claim/inquest-outcome-recovery",
  "/claim/pre-cert-costs",
  "/claim/paying-party",
  // All claims
  "/claim/check-your-answers",
  "/claim/confirmation/success",
];
