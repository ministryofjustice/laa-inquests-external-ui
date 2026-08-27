import { strict as assert } from "assert";
import { FinancialRecoveryCostsValidator } from "#src/adaptors/presenters/claim/FinancialRecoveryCosts/FinancialRecoveryCosts.validator.js";
import { FINANCIAL_RECOVERY_COSTS_ERROR } from "#src/infrastructure/locales/constants.js";

describe("FinancialRecoveryCosts validator", () => {
  describe("validateFinancialRecoveryCosts", () => {
    describe("when recovery cost has been made (YES)", () => {
      it("returns missing errors for costs, damages and interest when blank", () => {
        const validator = new FinancialRecoveryCostsValidator();

        const errors = validator.validateFinancialRecoveryCosts({}, "YES");

        assert.deepEqual(errors, {
          costsInputError: {
            text: FINANCIAL_RECOVERY_COSTS_ERROR.MISSING_COSTS,
          },
          damagesInputError: {
            text: FINANCIAL_RECOVERY_COSTS_ERROR.MISSING_DAMAGES,
          },
          interestInputError: {
            text: FINANCIAL_RECOVERY_COSTS_ERROR.MISSING_INTEREST,
          },
        });
      });

      it("does not require previous pre-certificate costs", () => {
        const validator = new FinancialRecoveryCostsValidator();

        const errors = validator.validateFinancialRecoveryCosts(
          { costs: "100", damages: "200", interest: "300" },
          "YES",
        );

        assert.deepEqual(errors, {});
      });

      it("returns invalid format errors for costs, damages and interest", () => {
        const validator = new FinancialRecoveryCostsValidator();

        const errors = validator.validateFinancialRecoveryCosts(
          { costs: "abc", damages: "abc", interest: "abc" },
          "YES",
        );

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
        });
      });

      it("returns an invalid format error when previous pre-certificate costs is entered but not a valid amount", () => {
        const validator = new FinancialRecoveryCostsValidator();

        const errors = validator.validateFinancialRecoveryCosts(
          {
            costs: "100",
            damages: "200",
            interest: "300",
            "previous-pre-certificate-costs": "abc",
          },
          "YES",
        );

        assert.deepEqual(errors, {
          previousPreCertificateCostsInputError: {
            text: FINANCIAL_RECOVERY_COSTS_ERROR.INVALID_PREVIOUS_PRE_CERTIFICATE_COSTS,
          },
        });
      });

      it("returns no errors when all fields are valid", () => {
        const validator = new FinancialRecoveryCostsValidator();

        const errors = validator.validateFinancialRecoveryCosts(
          {
            costs: "100",
            damages: "200.50",
            interest: "300",
            "previous-pre-certificate-costs": "400",
          },
          "YES",
        );

        assert.deepEqual(errors, {});
      });
    });

    describe("when recovery cost has not been made (NO / DONT_KNOW)", () => {
      for (const recoveryCostMade of ["NO", "DONT_KNOW"] as const) {
        it(`returns a missing error for previous pre-certificate costs when blank (${recoveryCostMade})`, () => {
          const validator = new FinancialRecoveryCostsValidator();

          const errors = validator.validateFinancialRecoveryCosts(
            {},
            recoveryCostMade,
          );

          assert.deepEqual(errors, {
            previousPreCertificateCostsInputError: {
              text: FINANCIAL_RECOVERY_COSTS_ERROR.MISSING_PREVIOUS_PRE_CERTIFICATE_COSTS,
            },
          });
        });

        it(`does not require costs, damages or interest (${recoveryCostMade})`, () => {
          const validator = new FinancialRecoveryCostsValidator();

          const errors = validator.validateFinancialRecoveryCosts(
            { "previous-pre-certificate-costs": "400" },
            recoveryCostMade,
          );

          assert.deepEqual(errors, {});
        });

        it(`returns invalid format errors for costs, damages and interest when entered but not valid amounts (${recoveryCostMade})`, () => {
          const validator = new FinancialRecoveryCostsValidator();

          const errors = validator.validateFinancialRecoveryCosts(
            {
              costs: "abc",
              damages: "abc",
              interest: "abc",
              "previous-pre-certificate-costs": "400",
            },
            recoveryCostMade,
          );

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
          });
        });
      }
    });

    it("treats an unexpected recoveryCostMade value like No / Don't know", () => {
      const validator = new FinancialRecoveryCostsValidator();

      const errors = validator.validateFinancialRecoveryCosts({}, undefined);

      assert.deepEqual(errors, {
        previousPreCertificateCostsInputError: {
          text: FINANCIAL_RECOVERY_COSTS_ERROR.MISSING_PREVIOUS_PRE_CERTIFICATE_COSTS,
        },
      });
    });
  });
});
