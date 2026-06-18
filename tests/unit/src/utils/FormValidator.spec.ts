import { FormValidator } from "#src/utils/FormValidator.js";
import { assert } from "chai";

class FormValidatorTestHarness extends FormValidator {
  public callValidateDateInput(
    day: string | undefined,
    month: string | undefined,
    year: string | undefined,
    errors: {
      missing: string;
      nonNumeric: string;
      invalidDate: string;
      futureDate: string;
    },
  ): string | undefined {
    return this.validateDateInput(day, month, year, errors);
  }
}

describe("FormValidator - validateDateInput", () => {
  const validator = new FormValidatorTestHarness();
  const STANDARD_ERRORS = {
    missing: "missing",
    nonNumeric: "nonNumeric",
    invalidDate: "invalidDate",
    futureDate: "futureDate",
  };

  it("returns undefined for valid date", () => {
    const errors = validator.callValidateDateInput(
      "1",
      "1",
      "2000",
      STANDARD_ERRORS,
    );
    assert.isUndefined(errors);
  });
});
