import { strict as assert } from "assert";
import { RecoveryCostMadeValidator } from "#src/adaptors/presenters/claim/RecoveryCostMade/RecoveryCostMade.validator.js";
import { RECOVERY_COST_ERROR } from "#src/infrastructure/locales/constants.js";

describe("RecoveryCostMade validator", () => {
  describe("validateRecoveryCostMade", () => {
    it("returns a missing error when no option is selected", () => {
      const validator = new RecoveryCostMadeValidator();

      const errors = validator.validateRecoveryCostMade({});

      assert.deepEqual(errors, {
        recoveryCostMadeInputError: {
          text: RECOVERY_COST_ERROR.MISSING_SELECTION,
        },
      });
    });

    it("returns no errors when Yes is selected", () => {
      const validator = new RecoveryCostMadeValidator();

      const errors = validator.validateRecoveryCostMade({
        "recovery-cost-made": "YES",
      });

      assert.deepEqual(errors, {});
    });

    it("returns no errors when No is selected", () => {
      const validator = new RecoveryCostMadeValidator();

      const errors = validator.validateRecoveryCostMade({
        "recovery-cost-made": "NO",
      });

      assert.deepEqual(errors, {});
    });

    it("returns no errors when Don't know is selected", () => {
      const validator = new RecoveryCostMadeValidator();

      const errors = validator.validateRecoveryCostMade({
        "recovery-cost-made": "DONT_KNOW",
      });

      assert.deepEqual(errors, {});
    });
  });
});
