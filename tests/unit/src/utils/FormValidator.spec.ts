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

  type DateInputTestCase = {
    testCase: string;
    date: [string | undefined, string | undefined, string | undefined];
    expectedError: string | undefined;
  };

  const tests: DateInputTestCase[] = [
    // Missing values
    {
      testCase: "returns missing when all fields are empty strings",
      date: ["", "", ""],
      expectedError: STANDARD_ERRORS.missing,
    },
    {
      testCase: "returns missing when day is empty",
      date: ["", "1", "2000"],
      expectedError: STANDARD_ERRORS.missing,
    },
    {
      testCase: "returns missing when month is empty",
      date: ["1", "", "2000"],
      expectedError: STANDARD_ERRORS.missing,
    },
    {
      testCase: "returns missing when year is empty",
      date: ["1", "1", ""],
      expectedError: STANDARD_ERRORS.missing,
    },
    {
      testCase: "prioritises missing over non-numeric when one field is empty",
      date: ["", "abc", "2000"],
      expectedError: STANDARD_ERRORS.missing,
    },

    // Non-numeric values
    {
      testCase: "returns nonNumeric when day is non-numeric",
      date: ["abc", "1", "2000"],
      expectedError: STANDARD_ERRORS.nonNumeric,
    },
    {
      testCase: "returns nonNumeric when month is non-numeric",
      date: ["1", "abc", "2000"],
      expectedError: STANDARD_ERRORS.nonNumeric,
    },
    {
      testCase: "returns nonNumeric when year is non-numeric",
      date: ["1", "1", "abc"],
      expectedError: STANDARD_ERRORS.nonNumeric,
    },
    {
      testCase: "returns nonNumeric when all fields are non-numeric",
      date: ["abc", "def", "ghi"],
      expectedError: STANDARD_ERRORS.nonNumeric,
    },
    {
      testCase: "returns nonNumeric when values are undefined",
      date: [undefined, undefined, undefined],
      expectedError: STANDARD_ERRORS.nonNumeric,
    },

    // Invalid calendar dates
    {
      testCase: "returns invalidDate for day out of range",
      date: ["32", "1", "2000"],
      expectedError: STANDARD_ERRORS.invalidDate,
    },
    {
      testCase: "returns invalidDate for month out of range",
      date: ["1", "13", "2000"],
      expectedError: STANDARD_ERRORS.invalidDate,
    },
    {
      testCase: "returns invalidDate for non-existent day in month",
      date: ["31", "4", "2024"],
      expectedError: STANDARD_ERRORS.invalidDate,
    },
    {
      testCase: "returns invalidDate for 29 February in non-leap year",
      date: ["29", "2", "2023"],
      expectedError: STANDARD_ERRORS.invalidDate,
    },

    // Future dates
    {
      testCase: "returns futureDate for a clear future year",
      date: ["1", "1", "3000"],
      expectedError: STANDARD_ERRORS.futureDate,
    },

    // Valid dates
    {
      testCase: "returns undefined for a standard valid date",
      date: ["1", "1", "2000"],
      expectedError: undefined,
    },
    {
      testCase: "returns undefined for a leap day in a leap year",
      date: ["29", "2", "2024"],
      expectedError: undefined,
    },
    {
      testCase: "returns undefined for single-digit day and month",
      date: ["7", "6", "2020"],
      expectedError: undefined,
    },
  ];

  tests.forEach(({ testCase, date, expectedError }) => {
    it(testCase, () => {
      const [day, month, year] = date;

      const actualError = validator.callValidateDateInput(
        day,
        month,
        year,
        STANDARD_ERRORS,
      );

      assert.deepEqual(actualError, expectedError);
    });
  });
});
