import { FormValidator } from "#src/utils/FormValidator.js";
import {
  MAX_CHARACTER_LENGTH,
  PAYING_PARTY_ERROR,
} from "#src/infrastructure/locales/constants.js";
import { isOrganisationName, normaliseFreeText } from "#src/utils/textRules.js";

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

    if (typeof payingParty !== "string") {
      return errorSummaries;
    }

    const name = normaliseFreeText(payingParty);

    if (name === "") {
      errorSummaries.payingPartyInputError = {
        text: PAYING_PARTY_ERROR.MISSING_PAYING_PARTY,
      };
    } else if (!isOrganisationName(name)) {
      errorSummaries.payingPartyInputError = {
        text: PAYING_PARTY_ERROR.INVALID_PAYING_PARTY_CHARACTERS,
      };
    } else if (name.length > MAX_CHARACTER_LENGTH) {
      errorSummaries.payingPartyInputError = {
        text: PAYING_PARTY_ERROR.PAYING_PARTY_EXCEEDS_MAX_CHARACTER_LENGTH,
      };
    }

    return errorSummaries;
  }
}
