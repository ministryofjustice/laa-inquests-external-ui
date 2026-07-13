import { strict as assert } from "assert";
import { TotalClaimValidator } from "#src/adaptors/presenters/claim/TotalClaim/TotalClaim.validator.js";
import { TOTAL_CLAIM_ERROR } from "#src/infrastructure/locales/constants.js";

describe("TotalClaimValidator", () => {
  describe("validateTotalClaim", () => {
    it("returns error when all inputs are empty", () => {
      const validator = new TotalClaimValidator();

      const errorSummaries = validator.validateTotalClaim({
        "zero-vat-total": "",
        "net-total": "",
        "gross-total": "",
      });

      assert.deepEqual(errorSummaries, {
        zeroVatTotalInputError: {
          text: TOTAL_CLAIM_ERROR.MISSING_TOTAL_CLAIM_COST,
        },
      });
    });

    it("returns error when zero VAT total is not numeric", () => {
      const validator = new TotalClaimValidator();

      const errorSummaries = validator.validateTotalClaim({
        "zero-vat-total": "abc",
      });

      assert.deepEqual(errorSummaries, {
        zeroVatTotalInputError: {
          text: TOTAL_CLAIM_ERROR.INVALID_ZERO_VAT_TOTAL,
        },
      });
    });

    it("returns error when net total has more than two decimal places", () => {
      const validator = new TotalClaimValidator();

      const errorSummaries = validator.validateTotalClaim({
        "net-total": "100.123",
      });

      assert.deepEqual(errorSummaries, {
        netTotalInputError: {
          text: TOTAL_CLAIM_ERROR.INVALID_NET_TOTAL,
        },
      });
    });

    it("returns error when gross total contains a currency symbol", () => {
      const validator = new TotalClaimValidator();

      const errorSummaries = validator.validateTotalClaim({
        "gross-total": "£100.00",
      });

      assert.deepEqual(errorSummaries, {
        grossTotalInputError: {
          text: TOTAL_CLAIM_ERROR.INVALID_GROSS_TOTAL,
        },
      });
    });

    it("returns error when net total is entered but gross total is missing", () => {
      const validator = new TotalClaimValidator();

      const errorSummaries = validator.validateTotalClaim({
        "net-total": "100",
        "gross-total": "",
      });

      assert.deepEqual(errorSummaries, {
        grossTotalInputError: {
          text: TOTAL_CLAIM_ERROR.MISSING_GROSS_TOTAL_WHEN_NET_ENTERED,
        },
      });
    });

    it("returns error on net total field when net total is higher than gross total", () => {
      const validator = new TotalClaimValidator();

      const errorSummaries = validator.validateTotalClaim({
        "net-total": "100",
        "gross-total": "99.99",
      });

      assert.deepEqual(errorSummaries, {
        netTotalInputError: {
          text: TOTAL_CLAIM_ERROR.NET_TOTAL_HIGHER_THAN_GROSS_TOTAL,
        },
      });
    });

    it("returns error when profit cost claim has both 0% and 20% VAT entered", () => {
      const validator = new TotalClaimValidator();

      const errorSummaries = validator.validateTotalClaim(
        {
          "zero-vat-total": "150",
          "net-total": "200",
          "gross-total": "440",
        },
        "PROFIT_COST",
      );

      assert.deepEqual(errorSummaries, {
        zeroVatTotalInputError: {
          text: TOTAL_CLAIM_ERROR.PROFIT_COST_MIXED_VAT,
        },
      });
    });

    it("returns error when gross total does not match expected calculation", () => {
      const validator = new TotalClaimValidator();

      const errorSummaries = validator.validateTotalClaim({
        "zero-vat-total": "50",
        "net-total": "100",
        "gross-total": "160",
      });

      assert.deepEqual(errorSummaries, {
        grossTotalInputError: {
          text: TOTAL_CLAIM_ERROR.INVALID_GROSS_TOTAL_CALCULATION,
        },
      });
    });

    it("returns empty errors when zero VAT total is entered alone with a valid value", () => {
      const validator = new TotalClaimValidator();

      const errorSummaries = validator.validateTotalClaim({
        "zero-vat-total": "25.50",
      });

      assert.deepEqual(errorSummaries, {});
    });

    it("returns empty errors when values are valid and gross total matches calculation", () => {
      const validator = new TotalClaimValidator();

      const errorSummaries = validator.validateTotalClaim({
        "zero-vat-total": "100",
        "net-total": "250.25",
        "gross-total": "400.30",
      });

      assert.deepEqual(errorSummaries, {});
    });

    it("trims input values before validating", () => {
      const validator = new TotalClaimValidator();

      const errorSummaries = validator.validateTotalClaim({
        "zero-vat-total": " 100 ",
        "net-total": " 250.25 ",
        "gross-total": " 400.30 ",
      });

      assert.deepEqual(errorSummaries, {});
    });
  });
});
