import { DeceasedDetailsValidator } from "#src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.validator.js";
import { DeceasedDetailsFormData } from "#src/adaptors/presenters/apply/models/form.types.js";
import { DECEASED_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";
import assert from "assert";

describe("DeceasedDetails.validator", () => {
  const formValidator = new DeceasedDetailsValidator();

  describe("validate names", () => {
    it("Adds error when first name is empty", () => {
      const body = {
        "deceased-first-name": "",
        "deceased-last-name": "Test",
      };
      const errorSummaries = formValidator.validateName(body);
      assert.deepEqual(errorSummaries, {
        firstNameInputError: {
          text: DECEASED_DETAILS_ERROR.MISSING_FIRST_NAME,
        },
      });
    });

    it("Adds error when last name is empty", () => {
      const body = {
        "deceased-first-name": "Test",
        "deceased-last-name": "",
      };
      const errorSummaries = formValidator.validateName(body);
      assert.deepEqual(errorSummaries, {
        lastNameInputError: {
          text: DECEASED_DETAILS_ERROR.MISSING_LAST_NAME,
        },
      });
    });

    it("Adds error when first name is over 100 characters", () => {
      const body = {
        "deceased-first-name": "a".repeat(101),
        "deceased-last-name": "Test",
      };
      const errorSummaries = formValidator.validateName(body);
      assert.deepEqual(errorSummaries, {
        firstNameInputError: {
          text: DECEASED_DETAILS_ERROR.FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
        },
      });
    });

    it("Adds error when last name is over 100 characters", () => {
      const body = {
        "deceased-first-name": "Test",
        "deceased-last-name": "a".repeat(101),
      };
      const errorSummaries = formValidator.validateName(body);
      assert.deepEqual(errorSummaries, {
        lastNameInputError: {
          text: DECEASED_DETAILS_ERROR.LAST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
        },
      });
    });
  });

  describe("validateDeceasedDateOfDeath", () => {
    const testCases = [
      {
        testCase: "day of death not provided",
        dateOfDeath: "/02/1990",
        expectedError: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_DEATH_INPUT,
      },
      {
        testCase: "month of death not provided",
        dateOfDeath: "1//1990",
        expectedError: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_DEATH_INPUT,
      },
      {
        testCase: "month of death not provided",
        dateOfDeath: "1//1990",
        expectedError: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_DEATH_INPUT,
      },
      {
        testCase: "year of death not provided",
        dateOfDeath: "1/1/",
        expectedError: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_DEATH_INPUT,
      },
      {
        testCase: "date is non-numeric",
        dateOfDeath: "abc/abc/abc",
        expectedError: DECEASED_DETAILS_ERROR.NON_NUMERIC_DATE,
      },
      {
        testCase: "date is in year 3000",
        dateOfDeath: "1/1/3000",
        expectedError: DECEASED_DETAILS_ERROR.FUTURE_DATE,
      },
      {
        testCase: "day is 32",
        dateOfDeath: "32/1/2000",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
      {
        testCase: "day is 0",
        dateOfDeath: "0/1/2000",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
      {
        testCase: "month is 0",
        dateOfDeath: "1/0/2000",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
      {
        testCase: "month is 13",
        dateOfDeath: "1/13/2000",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
      {
        testCase: "year is 0",
        dateOfDeath: "1/13/0",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
    ];

    testCases.forEach(({ testCase, dateOfDeath, expectedError }) => {
      it(`should set error message to: "${expectedError}" when: ${testCase}`, () => {
        const dateParts = dateOfDeath.split("/");

        const formBody = {
          _csrf: "abcdefg",
          "deceased-date-of-death-day": dateParts[0],
          "deceased-date-of-death-month": dateParts[1],
          "deceased-date-of-death-year": dateParts[2],
        };

        testDateOfDeathInputError(formBody, expectedError);
      });
    });

    const testDateOfDeathInputError = (
      formBody: Partial<DeceasedDetailsFormData>,
      expectedErrorMessage: string,
    ) => {
      const errorSummaries =
        formValidator.validateDeceasedDateOfDeath(formBody);
      assert.deepEqual(errorSummaries, {
        dateOfDeathInputError: {
          text: expectedErrorMessage,
        },
      });
    };
  });
});
