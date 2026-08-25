import { strict as assert } from "assert";
import { FundingPostInquestValidator } from "#src/adaptors/presenters/claim/FundingPostInquest/FundingPostInquest.validator.js";
import { FUNDING_POST_INQUEST_ERROR } from "#src/infrastructure/locales/constants.js";

describe("FundingPostInquest validator", () => {
  describe("validateFunding", () => {
    it("returns a missing error when no option is selected", () => {
      const validator = new FundingPostInquestValidator();

      const errors = validator.validateFunding({});

      assert.deepEqual(errors, {
        fundingPostInquestInputError: {
          text: FUNDING_POST_INQUEST_ERROR.MISSING_SELECTION,
        },
      });
    });

    it("returns no errors when Yes is selected", () => {
      const validator = new FundingPostInquestValidator();

      const errors = validator.validateFunding({
        "funding-post-inquest": "YES",
      });

      assert.deepEqual(errors, {});
    });

    it("returns no errors when No is selected", () => {
      const validator = new FundingPostInquestValidator();

      const errors = validator.validateFunding({
        "funding-post-inquest": "NO",
      });

      assert.deepEqual(errors, {});
    });

    it("returns no errors when Don't know is selected", () => {
      const validator = new FundingPostInquestValidator();

      const errors = validator.validateFunding({
        "funding-post-inquest": "DONT_KNOW",
      });

      assert.deepEqual(errors, {});
    });
  });
});
