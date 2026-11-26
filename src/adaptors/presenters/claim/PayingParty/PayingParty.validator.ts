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

    const payingPartyError = this.validatePartyNameInput(payingParty, {
      missing: PAYING_PARTY_ERROR.MISSING_PAYING_PARTY,
      invalidCharacters: PAYING_PARTY_ERROR.INVALID_PAYING_PARTY_CHARACTERS,
      exceedsMaxLength:
        PAYING_PARTY_ERROR.PAYING_PARTY_EXCEEDS_MAX_CHARACTER_LENGTH,
    });
    if (payingPartyError !== undefined) {
      errorSummaries.payingPartyInputError = payingPartyError;
    }

    return errorSummaries;
  }
}
