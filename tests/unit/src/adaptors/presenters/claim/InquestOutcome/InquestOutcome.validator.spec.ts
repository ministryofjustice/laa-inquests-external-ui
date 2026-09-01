import { strict as assert } from "assert";
import { InquestOutcomeValidator } from "#src/adaptors/presenters/claim/InquestOutcome/InquestOutcome.validator.js";
import { INQUEST_OUTCOME_ERROR } from "#src/infrastructure/locales/constants.js";

describe("InquestOutcome validator", () => {
  describe("validateOutcome", () => {
    it("returns a missing error when no option is selected", () => {
      const validator = new InquestOutcomeValidator();

      const errors = validator.validateOutcome({});

      assert.deepEqual(errors, {
        inquestOutcomeInputError: {
          text: INQUEST_OUTCOME_ERROR.MISSING_SELECTION,
        },
      });
    });

    it("returns a missing error when the field is an empty string", () => {
      const validator = new InquestOutcomeValidator();

      const errors = validator.validateOutcome({ "inquest-outcome": "" });

      assert.deepEqual(errors, {
        inquestOutcomeInputError: {
          text: INQUEST_OUTCOME_ERROR.MISSING_SELECTION,
        },
      });
    });

    it("returns a missing error when the field is an empty array", () => {
      const validator = new InquestOutcomeValidator();

      const errors = validator.validateOutcome({ "inquest-outcome": [] });

      assert.deepEqual(errors, {
        inquestOutcomeInputError: {
          text: INQUEST_OUTCOME_ERROR.MISSING_SELECTION,
        },
      });
    });

    it("returns no errors when a single option is selected", () => {
      const validator = new InquestOutcomeValidator();

      const errors = validator.validateOutcome({
        "inquest-outcome": "ACCIDENT_OR_MISADVENTURE",
      });

      assert.deepEqual(errors, {});
    });

    it("returns no errors when multiple options are selected", () => {
      const validator = new InquestOutcomeValidator();

      const errors = validator.validateOutcome({
        "inquest-outcome": ["ACCIDENT_OR_MISADVENTURE"],
      });

      assert.deepEqual(errors, {});
    });
  });
});
