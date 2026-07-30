import { ProceedingValidator } from "#src/adaptors/presenters/apply/Proceeding/Proceeding.validator.js";
import { PROCEEDING_ERROR } from "#src/infrastructure/locales/constants.js";
import { assert } from "chai";

describe("ProceedingValidator", () => {
  describe("validateProceedingInput", () => {
    it("returns expected error message when no proceeding is selected", () => {
      const formValidator = new ProceedingValidator();
      const formBody = {
        _csrf: "abcdefg",
      };
      const errorSummaries = formValidator.validateProceedingInput(formBody);
      assert.deepEqual(errorSummaries, {
        noProceedingSelected: {
          text: PROCEEDING_ERROR.NO_PROCEEDING_SPECIFIED,
        },
      });
    });
  });
});
