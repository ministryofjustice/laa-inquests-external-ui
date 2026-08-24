import { strict as assert } from "assert";
import { CounselNumberValidator } from "#src/adaptors/presenters/claim/CounselNumber/CounselNumber.validator.js";
import { COUNSEL_NUMBER_ERROR } from "#src/infrastructure/locales/constants.js";

describe("CounselNumberValidator", () => {
  describe("validateCounselNumber", () => {
    it("returns error when no counsel number is selected", () => {
      const validator = new CounselNumberValidator();

      const errorSummaries = validator.validateCounselNumber({});

      assert.deepEqual(errorSummaries, {
        counselNumberInputError: {
          text: COUNSEL_NUMBER_ERROR.MISSING_COUNSEL_NUMBER,
        },
      });
    });

    it("returns empty error object when a counsel number is selected", () => {
      const validator = new CounselNumberValidator();

      const errorSummaries = validator.validateCounselNumber({
        "counsel-number": "2",
      });

      assert.deepEqual(errorSummaries, {});
    });

    it("returns empty error object when zero counsel is selected", () => {
      const validator = new CounselNumberValidator();

      const errorSummaries = validator.validateCounselNumber({
        "counsel-number": "0",
      });

      assert.deepEqual(errorSummaries, {});
    });
  });
});
