/**
 * Centralized journey sequences for apply and claim flows.
 *
 * These define the canonical step order for each journey.
 * The journey guard middleware uses these to prevent users from skipping steps.
 */

export const APPLY_JOURNEY_SEQUENCE = [
  "/apply/office-accounts",
  "/apply/client-details/name-and-dob",
  "/apply/client-details/nino",
  "/apply/client-details/has-prev-application",
  "/apply/client-details/home-address",
  "/apply/client-details/correspondence-address-source",
  "/apply/client-details/correspondence-address",
  "/apply/client-details/correspondence-recipient",
  "/apply/deceased-details/name",
  "/apply/deceased-details/dob",
  "/apply/deceased-details/dod",
  "/apply/deceased-details/client-relationship",
  "/apply/deceased-details/coroner-reference",
  "/apply/deceased-details/further-information",
  "/apply/proceedings",
  "/apply/public-authority",
  "/apply/upload-coroners-letter",
  "/apply/check-your-answers",
  "/apply/confirmation/client-declaration",
  "/apply/confirmation/success",
] as const;

// Journey sequences temporarily disabled for investigation
export const CLAIM_JOURNEY_SEQUENCE: string[] = [];
