import { strict as assert } from "assert";
import { FinancialRecoveryCostsValidator } from "#src/adaptors/presenters/claim/FinancialRecoveryCosts/FinancialRecoveryCosts.validator.js";
import { FINANCIAL_RECOVERY_COSTS_ERROR } from "#src/infrastructure/locales/constants.js";

describe("FinancialRecoveryCosts validator", () => {
  describe("validateFinancialRecoveryCosts", () => {
    it("returns no errors when all four fields are blank", () => {
      const validator = new FinancialRecoveryCostsValidator();

      const errors = validator.validateFinancialRecoveryCosts({});

      assert.deepEqual(errors, {});
    });

    it("returns no errors when only some fields are provided and valid", () => {
      const validator = new FinancialRecoveryCostsValidator();

      const errors = validator.validateFinancialRecoveryCosts({
        costs: "100",
        damages: "200",
        interest: "300",
      });

      assert.deepEqual(errors, {});
    });

    it("returns invalid format errors for all four fields", () => {
      const validator = new FinancialRecoveryCostsValidator();

      const errors = validator.validateFinancialRecoveryCosts({
        costs: "abc",
        damages: "abc",
        interest: "abc",
        "previous-pre-certificate-costs": "abc",
      });

      assert.deepEqual(errors, {
        costsInputError: {
          text: FINANCIAL_RECOVERY_COSTS_ERROR.INVALID_COSTS,
        },
        damagesInputError: {
          text: FINANCIAL_RECOVERY_COSTS_ERROR.INVALID_DAMAGES,
        },
        interestInputError: {
          text: FINANCIAL_RECOVERY_COSTS_ERROR.INVALID_INTEREST,
        },
        previousPreCertificateCostsInputError: {
          text: FINANCIAL_RECOVERY_COSTS_ERROR.INVALID_PREVIOUS_PRE_CERTIFICATE_COSTS,
        },
      });
    });

    it("returns no errors when all four fields are valid amounts", () => {
      const validator = new FinancialRecoveryCostsValidator();

      const errors = validator.validateFinancialRecoveryCosts({
        costs: "100",
        damages: "200.50",
        interest: "300",
        "previous-pre-certificate-costs": "400",
      });

      assert.deepEqual(errors, {});
    });
  });
});
