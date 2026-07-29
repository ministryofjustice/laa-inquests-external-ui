import { ProceedingsValidator } from "#src/adaptors/presenters/apply/Proceeding/Proceedings.validator.js";
import { PROCEEDING_ERROR } from "#src/infrastructure/locales/constants.js";
import { assert } from "chai";

describe("ProceedingsValidator", () => {
  describe("validateProceedingInput", () => {
    it("returns expected error message when no proceeding is selected", () => {
      const formValidator = new ProceedingsValidator();
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
