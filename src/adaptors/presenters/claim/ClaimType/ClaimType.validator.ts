import { FormValidator } from "#src/utils/FormValidator.js";
import { CLAIM_TYPE_ERROR } from "#src/infrastructure/locales/constants.js";

export interface ClaimTypeError {
  claimTypeInputError?: { text: string };
}

export interface ClaimSubtypeError {
  claimSubtypeInputError?: { text: string };
}

export interface ClaimTypeFormData {
  "claim-type"?: string;
}

export interface ClaimSubtypeFormData {
  "claim-subtype"?: string;
}

export class ClaimTypeValidator extends FormValidator {
  validateClaimType(
    formBody: Partial<ClaimTypeFormData>,
  ): Partial<ClaimTypeError> {
    const errorSummaries: Partial<ClaimTypeError> = {};
    const { "claim-type": claimType } = formBody;

    if (typeof claimType !== "string") {
      errorSummaries.claimTypeInputError = {
        text: CLAIM_TYPE_ERROR.MISSING_CLAIM_TYPE,
      };
    }

    return errorSummaries;
  }

  validateClaimSubtype(
    formBody: Partial<ClaimSubtypeFormData>,
  ): Partial<ClaimSubtypeError> {
    const errorSummaries: Partial<ClaimSubtypeError> = {};
    const { "claim-subtype": claimSubtype } = formBody;

    if (typeof claimSubtype !== "string") {
      errorSummaries.claimSubtypeInputError = {
        text: CLAIM_TYPE_ERROR.MISSING_CLAIM_SUBTYPE,
      };
    }

    return errorSummaries;
  }
}
