import { strict as assert } from "assert";
import { ClaimTypeValidator } from "#src/adaptors/presenters/claim/ClaimType/ClaimType.validator.js";
import { CLAIM_TYPE_ERROR } from "#src/infrastructure/locales/constants.js";

describe("ClaimTypeValidator", () => {
  describe("validateClaimType", () => {
    it("returns error when no claim type is selected", () => {
      const validator = new ClaimTypeValidator();

      const errorSummaries = validator.validateClaimType({});

      assert.deepEqual(errorSummaries, {
        claimTypeInputError: {
          text: CLAIM_TYPE_ERROR.MISSING_CLAIM_TYPE,
        },
      });
    });

    it("returns empty error object when a claim type is selected", () => {
      const validator = new ClaimTypeValidator();

      const errorSummaries = validator.validateClaimType({
        "claim-type": "PAYMENT_ON_ACCOUNT",
      });

      assert.deepEqual(errorSummaries, {});
    });
  });
});
