import { DeceasedDetailsValidator } from "#src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.validator.js";
import { DeceasedDetailsFormData } from "#src/adaptors/presenters/apply/models/form.types.js";
import { DECEASED_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";
import assert from "assert";

describe("DeceasedDetails.validator", () => {
  const formValidator = new DeceasedDetailsValidator();

  type DateValidationTestCase = {
    testCase: string;
    date: string;
    expectedError: string;
  };

  type DateValidationErrorSummary = Partial<Record<string, { text: string }>>;

  const buildDateFormBody = (
    date: string,
    dayField: keyof DeceasedDetailsFormData,
    monthField: keyof DeceasedDetailsFormData,
    yearField: keyof DeceasedDetailsFormData,
  ): Partial<DeceasedDetailsFormData> => {
    const [day, month, year] = date.split("/");

    return {
      _csrf: "abcdefg",
      [dayField]: day,
      [monthField]: month,
      [yearField]: year,
    } as Partial<DeceasedDetailsFormData>;
  };

  const runDateValidationTestCases = ({
    testCases,
    dayField,
    monthField,
    yearField,
    errorField,
    validateDate,
  }: {
    testCases: DateValidationTestCase[];
    dayField: keyof DeceasedDetailsFormData;
    monthField: keyof DeceasedDetailsFormData;
    yearField: keyof DeceasedDetailsFormData;
    errorField: string;
    validateDate: (
      formBody: Partial<DeceasedDetailsFormData>,
    ) => DateValidationErrorSummary;
  }) => {
    testCases.forEach(({ testCase, date, expectedError }) => {
      it(`should set error message to: "${expectedError}" when: ${testCase}`, () => {
        const formBody = buildDateFormBody(
          date,
          dayField,
          monthField,
          yearField,
        );

        const errorSummaries = validateDate(formBody);

        assert.deepEqual(errorSummaries, {
          [errorField]: {
            text: expectedError,
          },
        });
      });
    });
  };

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

    [
      ["a formula prefix", "=cmd"],
      ["a digit", "Smith1"],
      ["angle brackets", "<b>Smith</b>"],
      ["a newline", "Jane\nDoe"],
    ].forEach(([reason, value]) => {
      it(`Adds errors when first and last name contain ${reason}`, () => {
        const errorSummaries = formValidator.validateName({
          "deceased-first-name": value,
          "deceased-last-name": value,
        });
        assert.deepEqual(errorSummaries, {
          firstNameInputError: {
            text: DECEASED_DETAILS_ERROR.FIRST_NAME_INVALID_CHARACTERS,
          },
          lastNameInputError: {
            text: DECEASED_DETAILS_ERROR.LAST_NAME_INVALID_CHARACTERS,
          },
        });
      });
    });

    it("Adds missing errors when first and last name are only whitespace", () => {
      const errorSummaries = formValidator.validateName({
        "deceased-first-name": "  ",
        "deceased-last-name": "\t",
      });
      assert.deepEqual(errorSummaries, {
        firstNameInputError: {
          text: DECEASED_DETAILS_ERROR.MISSING_FIRST_NAME,
        },
        lastNameInputError: { text: DECEASED_DETAILS_ERROR.MISSING_LAST_NAME },
      });
    });

    [
      "O'Brien",
      "O\u2019Donald",
      "Smith-Jones",
      "Zoë",
      "Jose\u0301",
      "李明",
    ].forEach((value) => {
      it(`Accepts the name ${JSON.stringify(value)}`, () => {
        const errorSummaries = formValidator.validateName({
          "deceased-first-name": value,
          "deceased-last-name": ` ${value} `,
        });
        assert.deepEqual(errorSummaries, {});
      });
    });

    it("Accepts names of exactly 100 characters", () => {
      const errorSummaries = formValidator.validateName({
        "deceased-first-name": "a".repeat(100),
        "deceased-last-name": "b".repeat(100),
      });
      assert.deepEqual(errorSummaries, {});
    });
  });

  describe("validateDeceasedDateOfDeath", () => {
    const testCases = [
      {
        testCase: "day of death not provided",
        date: "/02/1990",
        expectedError: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_DEATH_INPUT,
      },
      {
        testCase: "month of death not provided",
        date: "1//1990",
        expectedError: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_DEATH_INPUT,
      },
      {
        testCase: "month of death not provided",
        date: "1//1990",
        expectedError: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_DEATH_INPUT,
      },
      {
        testCase: "year of death not provided",
        date: "1/1/",
        expectedError: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_DEATH_INPUT,
      },
      {
        testCase: "date is non-numeric",
        date: "abc/abc/abc",
        expectedError: DECEASED_DETAILS_ERROR.NON_NUMERIC_DATE_OF_DEATH,
      },
      {
        testCase: "date is in year 3000",
        date: "1/1/3000",
        expectedError: DECEASED_DETAILS_ERROR.FUTURE_DATE_OF_DEATH,
      },
      {
        testCase: "day is 32",
        date: "32/1/2000",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
      {
        testCase: "day is 0",
        date: "0/1/2000",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
      {
        testCase: "month is 0",
        date: "1/0/2000",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
      {
        testCase: "month is 13",
        date: "1/13/2000",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
      {
        testCase: "year is 0",
        date: "1/13/0",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
    ] satisfies DateValidationTestCase[];

    runDateValidationTestCases({
      testCases,
      dayField: "deceased-date-of-death-day",
      monthField: "deceased-date-of-death-month",
      yearField: "deceased-date-of-death-year",
      errorField: "dateOfDeathInputError",
      validateDate: (formBody) =>
        formValidator.validateDeceasedDateOfDeath(formBody),
    });

    it("should not return an error for valid date with single-digit day and month", () => {
      const formBody = buildDateFormBody(
        "1/6/2020",
        "deceased-date-of-death-day",
        "deceased-date-of-death-month",
        "deceased-date-of-death-year",
      );
      const errorSummaries =
        formValidator.validateDeceasedDateOfDeath(formBody);
      assert.deepEqual(errorSummaries, {});
    });
  });

  describe("validateDeceasedDateOfBirth", () => {
    const testCases = [
      {
        testCase: "day of birth not provided",
        date: "/02/1990",
        expectedError: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_BIRTH_INPUT,
      },
      {
        testCase: "month of birth not provided",
        date: "1//1990",
        expectedError: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_BIRTH_INPUT,
      },
      {
        testCase: "year of birth not provided",
        date: "1/1/",
        expectedError: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_BIRTH_INPUT,
      },
      {
        testCase: "date is non-numeric",
        date: "abc/abc/abc",
        expectedError: DECEASED_DETAILS_ERROR.NON_NUMERIC_DATE_OF_BIRTH,
      },
      {
        testCase: "date is in year 3000",
        date: "1/1/3000",
        expectedError: DECEASED_DETAILS_ERROR.FUTURE_DATE_OF_BIRTH,
      },
      {
        testCase: "day is 32",
        date: "32/1/2000",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
      {
        testCase: "day is 0",
        date: "0/1/2000",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
      {
        testCase: "month is 0",
        date: "1/0/2000",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
      {
        testCase: "month is 13",
        date: "1/13/2000",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
      {
        testCase: "year is 0",
        date: "1/13/0",
        expectedError: DECEASED_DETAILS_ERROR.INVALID_DATE,
      },
    ] satisfies DateValidationTestCase[];

    runDateValidationTestCases({
      testCases,
      dayField: "deceased-date-of-birth-day",
      monthField: "deceased-date-of-birth-month",
      yearField: "deceased-date-of-birth-year",
      errorField: "dateOfBirthInputError",
      validateDate: (formBody) =>
        formValidator.validateDeceasedDateOfBirth(formBody),
    });

    it("should not return an error for valid date with single-digit day and month", () => {
      const formBody = buildDateFormBody(
        "1/6/1990",
        "deceased-date-of-birth-day",
        "deceased-date-of-birth-month",
        "deceased-date-of-birth-year",
      );
      const errorSummaries =
        formValidator.validateDeceasedDateOfBirth(formBody);
      assert.deepEqual(errorSummaries, {});
    });
  });

  describe("cross-date validation", () => {
    const buildDatePart = (date: string) => {
      const [day, month, year] = date.split("/");
      return { day, month, year };
    };

    describe("validateDeceasedDateOfBirth against date of death", () => {
      it("returns an error when date of birth is after date of death", () => {
        const formBody = buildDateFormBody(
          "2/1/2000",
          "deceased-date-of-birth-day",
          "deceased-date-of-birth-month",
          "deceased-date-of-birth-year",
        );

        const errorSummaries = formValidator.validateDeceasedDateOfBirth(
          formBody,
          buildDatePart("1/1/2000"),
        );

        assert.deepEqual(errorSummaries, {
          dateOfBirthInputError: {
            text: DECEASED_DETAILS_ERROR.DATE_OF_BIRTH_AFTER_DATE_OF_DEATH,
          },
        });
      });

      it("returns no error when date of birth equals date of death", () => {
        const formBody = buildDateFormBody(
          "1/1/2000",
          "deceased-date-of-birth-day",
          "deceased-date-of-birth-month",
          "deceased-date-of-birth-year",
        );

        const errorSummaries = formValidator.validateDeceasedDateOfBirth(
          formBody,
          buildDatePart("1/1/2000"),
        );

        assert.deepEqual(errorSummaries, {});
      });

      it("returns no error when date of birth is before date of death", () => {
        const formBody = buildDateFormBody(
          "1/1/1990",
          "deceased-date-of-birth-day",
          "deceased-date-of-birth-month",
          "deceased-date-of-birth-year",
        );

        const errorSummaries = formValidator.validateDeceasedDateOfBirth(
          formBody,
          buildDatePart("1/1/2000"),
        );

        assert.deepEqual(errorSummaries, {});
      });

      it("returns the format error and skips the cross-date check when date of birth is invalid", () => {
        const formBody = buildDateFormBody(
          "32/1/2000",
          "deceased-date-of-birth-day",
          "deceased-date-of-birth-month",
          "deceased-date-of-birth-year",
        );

        const errorSummaries = formValidator.validateDeceasedDateOfBirth(
          formBody,
          buildDatePart("1/1/1990"),
        );

        assert.deepEqual(errorSummaries, {
          dateOfBirthInputError: {
            text: DECEASED_DETAILS_ERROR.INVALID_DATE,
          },
        });
      });

      it("returns no cross-date error when date of death is not a valid date", () => {
        const formBody = buildDateFormBody(
          "2/1/2000",
          "deceased-date-of-birth-day",
          "deceased-date-of-birth-month",
          "deceased-date-of-birth-year",
        );

        const errorSummaries = formValidator.validateDeceasedDateOfBirth(
          formBody,
          buildDatePart("//"),
        );

        assert.deepEqual(errorSummaries, {});
      });
    });

    describe("validateDeceasedDateOfDeath against date of birth", () => {
      it("returns an error when date of death is before date of birth", () => {
        const formBody = buildDateFormBody(
          "1/1/1990",
          "deceased-date-of-death-day",
          "deceased-date-of-death-month",
          "deceased-date-of-death-year",
        );

        const errorSummaries = formValidator.validateDeceasedDateOfDeath(
          formBody,
          buildDatePart("2/1/1990"),
        );

        assert.deepEqual(errorSummaries, {
          dateOfDeathInputError: {
            text: DECEASED_DETAILS_ERROR.DATE_OF_DEATH_BEFORE_DATE_OF_BIRTH,
          },
        });
      });

      it("returns no error when date of death equals date of birth", () => {
        const formBody = buildDateFormBody(
          "1/1/1990",
          "deceased-date-of-death-day",
          "deceased-date-of-death-month",
          "deceased-date-of-death-year",
        );

        const errorSummaries = formValidator.validateDeceasedDateOfDeath(
          formBody,
          buildDatePart("1/1/1990"),
        );

        assert.deepEqual(errorSummaries, {});
      });

      it("returns no error when date of death is after date of birth", () => {
        const formBody = buildDateFormBody(
          "1/1/2000",
          "deceased-date-of-death-day",
          "deceased-date-of-death-month",
          "deceased-date-of-death-year",
        );

        const errorSummaries = formValidator.validateDeceasedDateOfDeath(
          formBody,
          buildDatePart("1/1/1990"),
        );

        assert.deepEqual(errorSummaries, {});
      });

      it("returns the format error and skips the cross-date check when date of death is invalid", () => {
        const formBody = buildDateFormBody(
          "32/1/1990",
          "deceased-date-of-death-day",
          "deceased-date-of-death-month",
          "deceased-date-of-death-year",
        );

        const errorSummaries = formValidator.validateDeceasedDateOfDeath(
          formBody,
          buildDatePart("1/1/2000"),
        );

        assert.deepEqual(errorSummaries, {
          dateOfDeathInputError: {
            text: DECEASED_DETAILS_ERROR.INVALID_DATE,
          },
        });
      });

      it("returns no cross-date error when date of birth is not a valid date", () => {
        const formBody = buildDateFormBody(
          "1/1/1990",
          "deceased-date-of-death-day",
          "deceased-date-of-death-month",
          "deceased-date-of-death-year",
        );

        const errorSummaries = formValidator.validateDeceasedDateOfDeath(
          formBody,
          buildDatePart("//"),
        );

        assert.deepEqual(errorSummaries, {});
      });
    });
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

    it("returns no error when no is selected", () => {
      const errorSummaries = formValidator.validateClientRelationship({
        _csrf: "abcdefg",
        "deceased-has-client-relationship": "false",
      });

      assert.deepEqual(errorSummaries, {});
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

    [
      ["a formula prefix", "=cmd"],
      ["a slash", "Husband/Wife"],
      ["brackets", "Son (adopted)"],
      ["angle brackets", "<b>Spouse</b>"],
      ["a digit", "Aunt2"],
      ["a newline", "Step\nfather"],
    ].forEach(([reason, value]) => {
      it(`returns an error when relationship contains ${reason}`, () => {
        const errorSummaries = formValidator.validateClientRelationship({
          _csrf: "abcdefg",
          "deceased-has-client-relationship": "true",
          "deceased-client-relationship": value,
        });

        assert.deepEqual(errorSummaries, {
          clientRelationshipInputError: {
            text: DECEASED_DETAILS_ERROR.RELATIONSHIP_INVALID_CHARACTERS,
          },
        });
      });
    });

    it("returns a missing error when relationship is only whitespace", () => {
      const errorSummaries = formValidator.validateClientRelationship({
        _csrf: "abcdefg",
        "deceased-has-client-relationship": "true",
        "deceased-client-relationship": "   ",
      });

      assert.deepEqual(errorSummaries, {
        clientRelationshipInputError: {
          text: DECEASED_DETAILS_ERROR.RELATIONSHIP_REQUIRED_MIN_MAX,
        },
      });
    });

    [
      "Spouse",
      "Mother-in-law",
      "Partner's brother",
      "Child\u2019s guardian",
    ].forEach((value) => {
      it(`returns no error for the relationship ${JSON.stringify(value)}`, () => {
        const errorSummaries = formValidator.validateClientRelationship({
          _csrf: "abcdefg",
          "deceased-has-client-relationship": "true",
          "deceased-client-relationship": ` ${value} `,
        });

        assert.deepEqual(errorSummaries, {});
      });
    });

    it("returns no error when relationship is exactly 70 characters", () => {
      const errorSummaries = formValidator.validateClientRelationship({
        _csrf: "abcdefg",
        "deceased-has-client-relationship": "true",
        "deceased-client-relationship": "a".repeat(70),
      });

      assert.deepEqual(errorSummaries, {});
    });

    it("ignores the relationship text when no is selected", () => {
      const errorSummaries = formValidator.validateClientRelationship({
        _csrf: "abcdefg",
        "deceased-has-client-relationship": "false",
        "deceased-client-relationship": "=cmd",
      });

      assert.deepEqual(errorSummaries, {});
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

    [
      ["a formula prefix", "=cmd"],
      ["a leading hyphen", "-COR-1"],
      ["a leading full stop", ".COR-1"],
      ["an underscore", "COR_1"],
      ["a semicolon", "COR;1"],
      ["angle brackets", "<script>alert(1)</script>"],
      ["a newline", "COR\n1"],
      ["an accented letter", "CÖR-1"],
      ["a long s", "\u017F1"],
    ].forEach(([reason, value]) => {
      it(`returns an error when coroner reference contains ${reason}`, () => {
        const errorSummaries = formValidator.validateCoronerReference({
          _csrf: "abcdefg",
          "deceased-coroner-reference": value,
        });

        assert.deepEqual(errorSummaries, {
          coronerReferenceInputError: {
            text: DECEASED_DETAILS_ERROR.CORONER_REFERENCE_INVALID_CHARACTERS,
          },
        });
      });
    });

    [
      "COR-2025-001",
      "2025/123",
      "AB 12.34",
      "a",
      "  COR-1  ",
      "a".repeat(50),
    ].forEach((value) => {
      it(`returns no error for the coroner reference ${JSON.stringify(value)}`, () => {
        const errorSummaries = formValidator.validateCoronerReference({
          _csrf: "abcdefg",
          "deceased-coroner-reference": value,
        });

        assert.deepEqual(errorSummaries, {});
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

    it("does not return an error when yes is selected and information is empty", () => {
      const errorSummaries = formValidator.validateFurtherInformation({
        _csrf: "abcdefg",
        "deceased-has-further-information": "true",
        "deceased-further-information": "",
      });

      assert.deepEqual(errorSummaries, {});
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

    [
      ["a less-than sign", "a < b"],
      ["a greater-than sign", "a > b"],
      ["a script tag", "<script>alert(1)</script>"],
      ["a control character", "bell\u0007"],
      ["a null byte", "null\u0000byte"],
      ["a zero-width character", "zero\u200bwidth"],
      ["a right-to-left override", "\u202etxt.exe"],
    ].forEach(([reason, value]) => {
      it(`returns an error when information contains ${reason}`, () => {
        const errorSummaries = formValidator.validateFurtherInformation({
          _csrf: "abcdefg",
          "deceased-has-further-information": "true",
          "deceased-further-information": value,
        });

        assert.deepEqual(errorSummaries, {
          furtherInformationInputError: {
            text: DECEASED_DETAILS_ERROR.FURTHER_INFORMATION_INVALID_CHARACTERS,
          },
        });
      });
    });

    [
      "Linked case INQ-123; the family member's inquest (see notes) & more.",
      "line one\nline two",
      "line one\r\nline two",
      "column\tone",
      "Zoë 李明 \u2019s case",
      "=SUM(A1) +1 @x -2",
      "a".repeat(500),
    ].forEach((value) => {
      it(`returns no error for the information ${JSON.stringify(value.slice(0, 40))}`, () => {
        const errorSummaries = formValidator.validateFurtherInformation({
          _csrf: "abcdefg",
          "deceased-has-further-information": "true",
          "deceased-further-information": value,
        });

        assert.deepEqual(errorSummaries, {});
      });
    });

    it("ignores the information text when no is selected", () => {
      const errorSummaries = formValidator.validateFurtherInformation({
        _csrf: "abcdefg",
        "deceased-has-further-information": "false",
        "deceased-further-information": "<script>",
      });

      assert.deepEqual(errorSummaries, {});
    });
  });
});
