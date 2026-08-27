import { FormValidator } from "#src/utils/FormValidator.js";
import { PRE_CERTIFICATE_COSTS_ERROR } from "#src/infrastructure/locales/constants.js";

const VALID_MONETARY_INPUT_REGEX = /^(?:[0-9]+(?:\.[0-9]{1,2})?)$/v;

export interface PreCertificateCostsFormData {
  "pre-certificate-costs"?: string;
}

export interface PreCertificateCostsError {
  preCertificateCostsInputError?: { text: string };
}

export class PreCertificateCostsValidator extends FormValidator {
  validatePreCertificateCosts(
    formBody: Partial<PreCertificateCostsFormData>,
  ): Partial<PreCertificateCostsError> {
    const preCertificateCosts = this.#normaliseInput(
      formBody["pre-certificate-costs"],
    );

    if (preCertificateCosts === undefined) {
      return {
        preCertificateCostsInputError: {
          text: PRE_CERTIFICATE_COSTS_ERROR.MISSING,
        },
      };
    }

    if (!this.#isValidMonetaryValue(preCertificateCosts)) {
      return {
        preCertificateCostsInputError: {
          text: PRE_CERTIFICATE_COSTS_ERROR.INVALID,
        },
      };
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
