import { FormValidator } from "#src/utils/FormValidator.js";
import { TOTAL_CLAIM_ERROR } from "#src/infrastructure/locales/constants.js";

const VALID_MONETARY_INPUT_REGEX = /^(?:[0-9]+(?:\.[0-9]{1,2})?)$/v;
const VAT_RATE = 0.2;
const PENCE_DIVISOR = 100;

export interface TotalClaimFormData {
  "zero-vat-total"?: string;
  "net-total"?: string;
  "gross-total"?: string;
}

export interface TotalClaimError {
  zeroVatTotalInputError?: { text: string };
  netTotalInputError?: { text: string };
  grossTotalInputError?: { text: string };
}

interface NormalisedTotalClaimFormData {
  zeroVatTotal?: string;
  netTotal?: string;
  grossTotal?: string;
}

export class TotalClaimValidator extends FormValidator {
  validateTotalClaim(
    formBody: Partial<TotalClaimFormData>,
  ): Partial<TotalClaimError> {
    const normalisedForm = this.#normaliseFormData(formBody);

    if (this.#isAllFieldsBlank(normalisedForm)) {
      return {
        zeroVatTotalInputError: {
          text: TOTAL_CLAIM_ERROR.MISSING_TOTAL_CLAIM_COST,
        },
      };
    }

    const errorSummaries = this.#buildFieldFormatErrors(normalisedForm);

    const missingGrossTotalError =
      this.#validateGrossTotalIsPresentWhenNetTotalEntered(
        normalisedForm,
        errorSummaries,
      );

    if (missingGrossTotalError !== undefined) {
      return {
        ...errorSummaries,
        grossTotalInputError: {
          text: missingGrossTotalError,
        },
      };
    }

    if (errorSummaries.zeroVatTotalInputError !== undefined) {
      return errorSummaries;
    }

    if (errorSummaries.netTotalInputError !== undefined) {
      return errorSummaries;
    }

    const calculationError =
      this.#validateGrossTotalCalculation(normalisedForm);

    if (calculationError !== undefined) {
      return {
        ...errorSummaries,
        grossTotalInputError: {
          text: calculationError,
        },
      };
    }

    return errorSummaries;
  }

  #normaliseFormData(
    formBody: Partial<TotalClaimFormData>,
  ): NormalisedTotalClaimFormData {
    return {
      zeroVatTotal: this.#normaliseInput(formBody["zero-vat-total"]),
      netTotal: this.#normaliseInput(formBody["net-total"]),
      grossTotal: this.#normaliseInput(formBody["gross-total"]),
    };
  }

  #buildFieldFormatErrors(
    formData: NormalisedTotalClaimFormData,
  ): Partial<TotalClaimError> {
    const errorSummaries: Partial<TotalClaimError> = {};

    if (
      formData.zeroVatTotal !== undefined &&
      !this.#hasValidMonetaryValue(formData.zeroVatTotal)
    ) {
      errorSummaries.zeroVatTotalInputError = {
        text: TOTAL_CLAIM_ERROR.INVALID_ZERO_VAT_TOTAL,
      };
    }

    if (
      formData.netTotal !== undefined &&
      !this.#hasValidMonetaryValue(formData.netTotal)
    ) {
      errorSummaries.netTotalInputError = {
        text: TOTAL_CLAIM_ERROR.INVALID_NET_TOTAL,
      };
    }

    if (
      formData.grossTotal !== undefined &&
      !this.#hasValidMonetaryValue(formData.grossTotal)
    ) {
      errorSummaries.grossTotalInputError = {
        text: TOTAL_CLAIM_ERROR.INVALID_GROSS_TOTAL,
      };
    }

    return errorSummaries;
  }

  #validateGrossTotalIsPresentWhenNetTotalEntered(
    formData: NormalisedTotalClaimFormData,
    errorSummaries: Partial<TotalClaimError>,
  ): string | undefined {
    if (
      formData.netTotal !== undefined &&
      formData.grossTotal === undefined &&
      errorSummaries.netTotalInputError === undefined
    ) {
      return TOTAL_CLAIM_ERROR.MISSING_GROSS_TOTAL_WHEN_NET_ENTERED;
    }

    return undefined;
  }

  #validateGrossTotalCalculation(
    formData: NormalisedTotalClaimFormData,
  ): string | undefined {
    const zeroVatValue = this.#parseMonetaryValue(formData.zeroVatTotal);
    const netTotalValue = this.#parseMonetaryValue(formData.netTotal);
    const grossTotalValue = this.#parseMonetaryValue(formData.grossTotal);

    if (
      this.#hasValidMonetaryValue(formData.grossTotal) &&
      this.#hasValidMonetaryValue(formData.netTotal) &&
      grossTotalValue! < netTotalValue!
    ) {
      return TOTAL_CLAIM_ERROR.GROSS_TOTAL_LESS_THAN_NET_TOTAL;
    }

    if (
      !this.#hasValidMonetaryValue(formData.grossTotal) ||
      !this.#hasValidMonetaryValue(formData.zeroVatTotal) ||
      !this.#hasValidMonetaryValue(formData.netTotal)
    ) {
      return undefined;
    }

    const expectedGrossTotal = this.#roundToTwo(
      zeroVatValue! + netTotalValue! + netTotalValue! * VAT_RATE,
    );

    if (grossTotalValue !== expectedGrossTotal) {
      return TOTAL_CLAIM_ERROR.INVALID_GROSS_TOTAL_CALCULATION;
    }

    return undefined;
  }

  #isAllFieldsBlank(formData: NormalisedTotalClaimFormData): boolean {
    return (
      formData.zeroVatTotal === undefined &&
      formData.netTotal === undefined &&
      formData.grossTotal === undefined
    );
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

  #hasValidMonetaryValue(inputValue: string | undefined): inputValue is string {
    return inputValue !== undefined && this.#isValidMonetaryValue(inputValue);
  }

  #isValidMonetaryValue(inputValue: string): boolean {
    return VALID_MONETARY_INPUT_REGEX.test(inputValue);
  }

  #parseMonetaryValue(inputValue: string | undefined): number | undefined {
    if (inputValue === undefined) {
      return undefined;
    }

    if (!this.#isValidMonetaryValue(inputValue)) {
      return undefined;
    }

    return this.#roundToTwo(Number(inputValue));
  }

  #roundToTwo(inputValue: number): number {
    return Math.round(inputValue * PENCE_DIVISOR) / PENCE_DIVISOR;
  }
}
