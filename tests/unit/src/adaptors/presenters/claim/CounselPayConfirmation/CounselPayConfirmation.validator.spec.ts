import { strict as assert } from "assert";
import { CounselPayConfirmationValidator } from "#src/adaptors/presenters/claim/CounselPayConfirmation/CounselPayConfirmation.validator.js";
import { COUNSEL_PAY_CONFIRMATION_ERROR } from "#src/infrastructure/locales/constants.js";

describe("CounselPayConfirmationValidator", () => {
  describe("validateConfirmation", () => {
    it("returns error when the confirmation checkbox is not ticked", () => {
      const validator = new CounselPayConfirmationValidator();

      const errorSummaries = validator.validateConfirmation({});

      assert.deepEqual(errorSummaries, {
        counselPayConfirmationInputError: {
          text: COUNSEL_PAY_CONFIRMATION_ERROR.MISSING_CONFIRMATION,
        },
      });
    });

    it("returns empty error object when the confirmation checkbox is ticked", () => {
      const validator = new CounselPayConfirmationValidator();

      const errorSummaries = validator.validateConfirmation({
        "counsel-bills-paid": "true",
      });

      assert.deepEqual(errorSummaries, {});
    });
  });
});
