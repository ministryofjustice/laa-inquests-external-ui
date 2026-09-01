import { FormValidator } from "#src/utils/FormValidator.js";
import { FINANCIAL_RECOVERY_COSTS_ERROR } from "#src/infrastructure/locales/constants.js";

const VALID_MONETARY_INPUT_REGEX = /^(?:[0-9]+(?:\.[0-9]{1,2})?)$/v;

export interface FinancialRecoveryCostsFormData {
  costs?: string;
  damages?: string;
  interest?: string;
  "previous-pre-certificate-costs"?: string;
}

export interface FinancialRecoveryCostsError {
  costsInputError?: { text: string };
  damagesInputError?: { text: string };
  interestInputError?: { text: string };
  previousPreCertificateCostsInputError?: { text: string };
}

export class FinancialRecoveryCostsValidator extends FormValidator {
  validateFinancialRecoveryCosts(
    formBody: Partial<FinancialRecoveryCostsFormData>,
  ): Partial<FinancialRecoveryCostsError> {
    const costs = this.#normaliseInput(formBody.costs);
    const damages = this.#normaliseInput(formBody.damages);
    const interest = this.#normaliseInput(formBody.interest);
    const previousPreCertificateCosts = this.#normaliseInput(
      formBody["previous-pre-certificate-costs"],
    );

    const errorSummaries: Partial<FinancialRecoveryCostsError> = {
      ...this.#validateField(costs, {
        invalidMessage: FINANCIAL_RECOVERY_COSTS_ERROR.INVALID_COSTS,
        errorKey: "costsInputError",
      }),
      ...this.#validateField(damages, {
        invalidMessage: FINANCIAL_RECOVERY_COSTS_ERROR.INVALID_DAMAGES,
        errorKey: "damagesInputError",
      }),
      ...this.#validateField(interest, {
        invalidMessage: FINANCIAL_RECOVERY_COSTS_ERROR.INVALID_INTEREST,
        errorKey: "interestInputError",
      }),
      ...this.#validateField(previousPreCertificateCosts, {
        invalidMessage:
          FINANCIAL_RECOVERY_COSTS_ERROR.INVALID_PREVIOUS_PRE_CERTIFICATE_COSTS,
        errorKey: "previousPreCertificateCostsInputError",
      }),
    };

    return errorSummaries;
  }

  #validateField(
    inputValue: string | undefined,
    messages: {
      invalidMessage: string;
      errorKey: keyof FinancialRecoveryCostsError;
    },
  ): Partial<FinancialRecoveryCostsError> {
    const { invalidMessage, errorKey } = messages;

    if (inputValue === undefined) {
      return {};
    }

    if (!this.#isValidMonetaryValue(inputValue)) {
      return { [errorKey]: { text: invalidMessage } };
    }

    return {};
  }

  #normaliseInput(inputValue: string | undefined): string | undefined {
    if (typeof inputValue !== "string") {
      return undefined;
    }

    const trimmedInput = inputValue.trim();

    if (trimmedInput === "") {
      return undefined;
    }

    return trimmedInput;
  }

  #isValidMonetaryValue(inputValue: string): boolean {
    return VALID_MONETARY_INPUT_REGEX.test(inputValue);
  }
}
