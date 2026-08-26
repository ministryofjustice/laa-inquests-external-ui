import { FormValidator } from "#src/utils/FormValidator.js";
import { FUNDING_POST_INQUEST_ERROR } from "#src/infrastructure/locales/constants.js";

export interface FundingPostInquestError {
  fundingPostInquestInputError?: { text: string };
}

export interface FundingPostInquestFormData {
  "funding-post-inquest"?: string;
}

export class FundingPostInquestValidator extends FormValidator {
  validateFunding(
    formBody: Partial<FundingPostInquestFormData>,
  ): Partial<FundingPostInquestError> {
    const errorSummaries: Partial<FundingPostInquestError> = {};
    const { "funding-post-inquest": fundingPostInquest } = formBody;

    if (typeof fundingPostInquest !== "string") {
      errorSummaries.fundingPostInquestInputError = {
        text: FUNDING_POST_INQUEST_ERROR.MISSING_SELECTION,
      };
    }

    return errorSummaries;
  }
}
