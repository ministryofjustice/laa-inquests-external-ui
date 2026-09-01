import { FormValidator } from "#src/utils/FormValidator.js";
import { PAYING_PARTY_ERROR } from "#src/infrastructure/locales/constants.js";

export interface PayingPartyError {
  payingPartyInputError?: { text: string };
}

export interface PayingPartyFormData {
  "paying-party"?: string;
}

export class PayingPartyValidator extends FormValidator {
  validatePayingParty(
    formBody: Partial<PayingPartyFormData>,
  ): Partial<PayingPartyError> {
    const errorSummaries: Partial<PayingPartyError> = {};
    const { "paying-party": payingParty } = formBody;

    if (this.validateFormInputValue(payingParty, true)) {
      errorSummaries.payingPartyInputError = {
        text: PAYING_PARTY_ERROR.MISSING_PAYING_PARTY,
      };
    }

    return errorSummaries;
  }
}
