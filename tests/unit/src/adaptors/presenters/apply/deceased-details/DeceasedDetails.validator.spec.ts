import { DeceasedDetailsValidator } from "#src/adaptors/presenters/apply/DeceasedDetails/DeceasedDetails.validator.js";
import { DECEASED_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";
import assert from "assert";

describe("DeceasedDetails.validator", () => {
  describe("validate names", () => {
    it("Adds error when first name is empty", () => {
      const validator = new DeceasedDetailsValidator();
      const body = {
        "deceased-first-name": "",
        "deceased-last-name": "Test",
      };
      const errorSummaries = validator.validateName(body);
      assert.deepEqual(errorSummaries, {
        firstNameInputError: {
          text: DECEASED_DETAILS_ERROR.MISSING_FIRST_NAME,
        },
      });
    });

    it("Adds error when last name is empty", () => {
      const validator = new DeceasedDetailsValidator();
      const body = {
        "deceased-first-name": "Test",
        "deceased-last-name": "",
      };
      const errorSummaries = validator.validateName(body);
      assert.deepEqual(errorSummaries, {
        lastNameInputError: {
          text: DECEASED_DETAILS_ERROR.MISSING_LAST_NAME,
        },
      });
    });

    it("Adds error when first name is over 100 characters", () => {
      const validator = new DeceasedDetailsValidator();
      const body = {
        "deceased-first-name": "a".repeat(101),
        "deceased-last-name": "Test",
      };
      const errorSummaries = validator.validateName(body);
      assert.deepEqual(errorSummaries, {
        firstNameInputError: {
          text: DECEASED_DETAILS_ERROR.FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
        },
      });
    });

    it("Adds error when last name is over 100 characters", () => {
      const validator = new DeceasedDetailsValidator();
      const body = {
        "deceased-first-name": "Test",
        "deceased-last-name": "a".repeat(101),
      };
      const errorSummaries = validator.validateName(body);
      assert.deepEqual(errorSummaries, {
        lastNameInputError: {
          text: DECEASED_DETAILS_ERROR.LAST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
        },
      });
    });
  });

  describe("validateDeceasedDateOfDeath", () => {
    it("adds error when day in date of death is not provided", () => {
      const formValidator = new DeceasedDetailsValidator();
      const formBody = {
        _csrf: "abcdefg",
        "deceased-date-of-death-day": "",
        "deceased-date-of-death-month": "11",
        "deceased-date-of-death-year": "1990",
      };
      const errorSummaries =
        formValidator.validateDeceasedDateOfDeath(formBody);
      assert.deepEqual(errorSummaries, {
        dateOfDeathInputError: {
          text: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_DEATH_INPUT,
        },
      });
    });
    it("adds error when month in date of death is not provided", () => {
      const formValidator = new DeceasedDetailsValidator();
      const formBody = {
        _csrf: "abcdefg",
        "deceased-date-of-death-day": "1",
        "deceased-date-of-death-month": "",
        "deceased-date-of-death-year": "1990",
      };
      const errorSummaries =
        formValidator.validateDeceasedDateOfDeath(formBody);
      assert.deepEqual(errorSummaries, {
        dateOfDeathInputError: {
          text: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_DEATH_INPUT,
        },
      });
    });
    it("adds error when year in date of death is not provided", () => {
      const formValidator = new DeceasedDetailsValidator();
      const formBody = {
        _csrf: "abcdefg",
        "deceased-date-of-death-day": "1",
        "deceased-date-of-death-month": "1",
        "deceased-date-of-death-year": "",
      };
      const errorSummaries =
        formValidator.validateDeceasedDateOfDeath(formBody);
      assert.deepEqual(errorSummaries, {
        dateOfDeathInputError: {
          text: DECEASED_DETAILS_ERROR.MISSING_DATE_OF_DEATH_INPUT,
        },
      });
    });
    it("adds error when date is non-numeric", () => {
      const formValidator = new DeceasedDetailsValidator();
      const formBody = {
        _csrf: "abcdefg",
        "deceased-date-of-death-day": "ab",
        "deceased-date-of-death-month": "abc",
        "deceased-date-of-death-year": "abc",
      };
      const errorSummaries =
        formValidator.validateDeceasedDateOfDeath(formBody);

      assert.deepEqual(errorSummaries, {
        dateOfDeathInputError: {
          text: DECEASED_DETAILS_ERROR.NON_NUMERIC_DATE,
        },
      });
    });
    it("adds error when date is in the future", () => {
      const formValidator = new DeceasedDetailsValidator();
      const formBody = {
        _csrf: "abcdefg",
        "deceased-date-of-death-day": "ab",
        "deceased-date-of-death-month": "abc",
        "deceased-date-of-death-year": "3000",
      };
      const errorSummaries =
        formValidator.validateDeceasedDateOfDeath(formBody);
      assert.deepEqual(errorSummaries, {
        dateOfDeathInputError: {
          text: DECEASED_DETAILS_ERROR.FUTURE_DATE,
        },
      });
    });
  });
});
