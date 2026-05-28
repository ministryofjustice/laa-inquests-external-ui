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
        expectedError: DECEASED_DETAILS_ERROR.NON_NUMERIC_DATE_OF_DEATH,
      },
      {
        testCase: "date is in year 3000",
        dateOfDeath: "1/1/3000",
        expectedError: DECEASED_DETAILS_ERROR.FUTURE_DATE_OF_DEATH,
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

  describe("validateDeceasedDateOfBirth", () => {
    const testCases = [
      {
        testCase: "day of birth not provided",
        dateOfBirth: "/02/1990",
        expectedError: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_BIRTH_INPUT,
      },
      {
        testCase: "month of birth not provided",
        dateOfBirth: "1//1990",
        expectedError: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_BIRTH_INPUT,
      },
      {
        testCase: "year of birth not provided",
        dateOfBirth: "1/1/",
        expectedError: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_BIRTH_INPUT,
      },
      {
        testCase: "date is non-numeric",
        dateOfBirth: "abc/abc/abc",
        expectedError: DECEASED_DETAILS_ERROR.NON_NUMERIC_DATE_OF_BIRTH,
      },
      {
        testCase: "date is in year 3000",
        dateOfBirth: "1/1/3000",
        expectedError: DECEASED_DETAILS_ERROR.FUTURE_DATE_OF_BIRTH,
      },
      {
        testCase: "day is 32",
        dateOfBirth: "32/1/2000",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
      {
        testCase: "day is 0",
        dateOfBirth: "0/1/2000",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
      {
        testCase: "month is 0",
        dateOfBirth: "1/0/2000",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
      {
        testCase: "month is 13",
        dateOfBirth: "1/13/2000",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
      {
        testCase: "year is 0",
        dateOfBirth: "1/13/0",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
    ];

    testCases.forEach(({ testCase, dateOfBirth, expectedError }) => {
      it(`should set error message to: "${expectedError}" when: ${testCase}`, () => {
        const dateParts = dateOfBirth.split("/");

        const formBody = {
          _csrf: "abcdefg",
          "deceased-date-of-birth-day": dateParts[0],
          "deceased-date-of-birth-month": dateParts[1],
          "deceased-date-of-birth-year": dateParts[2],
        };

        testDateOfBirthInputError(formBody, expectedError);
      });
    });

    const testDateOfBirthInputError = (
      formBody: Partial<DeceasedDetailsFormData>,
      expectedErrorMessage: string,
    ) => {
      const errorSummaries =
        formValidator.validateDeceasedDateOfBirth(formBody);
      assert.deepEqual(errorSummaries, {
        dateOfBirthInputError: {
          text: expectedErrorMessage,
        },
      });
    };
  });

  describe("validateClientRelationship", () => {
    it("returns an error when no radio option is selected", () => {
      const errorSummaries = formValidator.validateClientRelationship({
        _csrf: "abcdefg",
        "deceased-client-relationship": "",
      });

      assert.deepEqual(errorSummaries, {
        hasClientRelationshipInputError: {
          text: DECEASED_DETAILS_ERROR.RELATIONSHIP_SELECTION_REQUIRED,
        },
      });
    });

    it("returns an error when no is selected", () => {
      const errorSummaries = formValidator.validateClientRelationship({
        _csrf: "abcdefg",
        "deceased-has-client-relationship": "false",
      });

      assert.deepEqual(errorSummaries, {
        hasClientRelationshipInputError: {
          text: DECEASED_DETAILS_ERROR.RELATIONSHIP_NOT_ELIGIBLE,
        },
      });
    });

    it("returns an error when yes is selected but no relationship is provided", () => {
      const errorSummaries = formValidator.validateClientRelationship({
        _csrf: "abcdefg",
        "deceased-has-client-relationship": "true",
        "deceased-client-relationship": "",
      });

      assert.deepEqual(errorSummaries, {
        clientRelationshipInputError: {
          text: DECEASED_DETAILS_ERROR.RELATIONSHIP_REQUIRED_MIN_MAX,
        },
      });
    });

    it("returns an error when relationship exceeds 70 characters", () => {
      const errorSummaries = formValidator.validateClientRelationship({
        _csrf: "abcdefg",
        "deceased-has-client-relationship": "true",
        "deceased-client-relationship": "a".repeat(71),
      });

      assert.deepEqual(errorSummaries, {
        clientRelationshipInputError: {
          text: DECEASED_DETAILS_ERROR.RELATIONSHIP_EXCEEDS_MAX_CHARACTER_LENGTH,
        },
      });
    });
  });

  describe("validateCoronerReference", () => {
    it("returns no error when coroner reference is empty", () => {
      const errorSummaries = formValidator.validateCoronerReference({
        _csrf: "abcdefg",
        "deceased-coroner-reference": "",
      });

      assert.deepEqual(errorSummaries, {});
    });

    it("returns an error when coroner reference exceeds 50 characters", () => {
      const errorSummaries = formValidator.validateCoronerReference({
        _csrf: "abcdefg",
        "deceased-coroner-reference": "a".repeat(51),
      });

      assert.deepEqual(errorSummaries, {
        coronerReferenceInputError: {
          text: DECEASED_DETAILS_ERROR.CORONER_REFERENCE_EXCEEDS_MAX_CHARACTER_LENGTH,
        },
      });
    });
  });

  describe("validateFurtherInformation", () => {
    it("returns an error when no option is selected", () => {
      const errorSummaries = formValidator.validateFurtherInformation({
        _csrf: "abcdefg",
      });

      assert.deepEqual(errorSummaries, {
        hasFurtherInformationInputError: {
          text: DECEASED_DETAILS_ERROR.FURTHER_INFORMATION_SELECTION_REQUIRED,
        },
      });
    });

    it("returns an error when yes is selected and information is less than 2 characters", () => {
      const errorSummaries = formValidator.validateFurtherInformation({
        _csrf: "abcdefg",
        "deceased-has-further-information": "true",
        "deceased-further-information": "a",
      });

      assert.deepEqual(errorSummaries, {
        furtherInformationInputError: {
          text: DECEASED_DETAILS_ERROR.FURTHER_INFORMATION_MIN_MAX,
        },
      });
    });

    it("returns an error when yes is selected and information exceeds 500 characters", () => {
      const errorSummaries = formValidator.validateFurtherInformation({
        _csrf: "abcdefg",
        "deceased-has-further-information": "true",
        "deceased-further-information": "a".repeat(501),
      });

      assert.deepEqual(errorSummaries, {
        furtherInformationInputError: {
          text: DECEASED_DETAILS_ERROR.FURTHER_INFORMATION_MIN_MAX,
        },
      });
    });
  });
});
