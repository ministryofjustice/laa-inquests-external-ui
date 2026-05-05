import { assert } from "chai";
import { FormValidator } from "#src/utils/FormValidator.js";
import { CLIENT_DETAILS_ERROR } from "#src/infrastructure/locales/constants.js";

describe("FormValidator", () => {
  describe("methods", () => {
    describe("validateClientDob", () => {
      it("adds error when day in dob is not provided", () => {
        const formValidator = new FormValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "",
          "last-name": "fgdsfg",
          "last-name-at-birth": "",
          "dob-day": "",
          "dob-month": "11",
          "dob-year": "1990",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientDob(formBody);
        assert.deepEqual(errorSummaries, {
          dobInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_DOB_INPUT,
          },
        });
      });
      it("adds error when month in dob is not provided", () => {
        const formValidator = new FormValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "",
          "last-name": "fgdsfg",
          "last-name-at-birth": "",
          "dob-day": "31",
          "dob-month": "",
          "dob-year": "1990",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientDob(formBody);
        assert.deepEqual(errorSummaries, {
          dobInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_DOB_INPUT,
          },
        });
      });
      it("adds error when year in dob is not provided", () => {
        const formValidator = new FormValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "",
          "last-name": "fgdsfg",
          "last-name-at-birth": "",
          "dob-day": "31",
          "dob-month": "12",
          "dob-year": "",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientDob(formBody);

        assert.deepEqual(errorSummaries, {
          dobInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_DOB_INPUT,
          },
        });
      });
      it("adds error when date is non-numeric", () => {
        const formValidator = new FormValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "",
          "last-name": "fgdsfg",
          "last-name-at-birth": "",
          "dob-day": "abc",
          "dob-month": "abc",
          "dob-year": "abc",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientDob(formBody);

        assert.deepEqual(errorSummaries, {
          dobInputError: {
            text: CLIENT_DETAILS_ERROR.NON_NUMERIC_DATE,
          },
        });
      });
      it("adds error when date is in the future", () => {
        const formValidator = new FormValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "",
          "last-name": "fgdsfg",
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "3000",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientDob(formBody);
        assert.deepEqual(errorSummaries, {
          dobInputError: {
            text: CLIENT_DETAILS_ERROR.FUTURE_DATE,
          },
        });
      });
    });
    describe("validateClientName", () => {
      it("add error for no first name input when first name value is empty", () => {
        const formValidator = new FormValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "",
          "last-name": "fgdsfg",
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "2010",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientName(formBody);

        assert.deepEqual(errorSummaries, {
          firstNameInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_FIRST_NAME,
          },
        });
      });
      it("add error message for when first name exceeds max character length", () => {
        const formValidator = new FormValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "abcde".repeat(21),
          "last-name": "fgdsfg",
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "2010",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientName(formBody);

        assert.deepEqual(errorSummaries, {
          firstNameInputError: {
            text: CLIENT_DETAILS_ERROR.FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
          },
        });
      });
      it("add error message for no last name input provided when last name value is empty", () => {
        const formValidator = new FormValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "greggs",
          "last-name": "",
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "2010",
          "name-change": "false",
        };

        const errorSummaries = formValidator.validateClientName(formBody);
        assert.deepEqual(errorSummaries, {
          lastNameInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_LAST_NAME,
          },
        });
      });
      it("add error message for when last name exceeds max character length", () => {
        const formValidator = new FormValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "fgdsfg",
          "last-name": "abcde".repeat(21),
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "2010",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientName(formBody);
        assert.deepEqual(errorSummaries, {
          lastNameInputError: {
            text: CLIENT_DETAILS_ERROR.LAST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
          },
        });
      });
      it("adds error message when no radio button has been selected for name change", () => {
        const formValidator = new FormValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "greggs",
          "last-name": "sausage-roll",
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "2010",
        };
        const errorSummaries = formValidator.validateClientName(formBody);
        assert.deepEqual(errorSummaries, {
          noRadioSelected: { text: CLIENT_DETAILS_ERROR.INPUT_NOT_SELECTED },
        });
      });
      it("adds error message when yes radio button has been selected but no previous name has been provided", () => {
        const formValidator = new FormValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "greggs",
          "last-name": "sausage-roll",
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "2010",
          "name-change": "true",
        };
        const errorSummaries = formValidator.validateClientName(formBody);
        assert.deepEqual(errorSummaries, {
          noBirthNameSpecified: {
            text: CLIENT_DETAILS_ERROR.MISSING_LAST_NAME_AT_BIRTH,
          },
        });
      });
      it("adds error messages for each input when multiple are not populated", () => {
        const formValidator = new FormValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "",
          "last-name": "",
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "2010",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientName(formBody);
        assert.deepEqual(errorSummaries, {
          firstNameInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_FIRST_NAME,
          },
          lastNameInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_LAST_NAME,
          },
        });
      });
      it("adds error messages for each input when multiple are exceeding character limit", () => {
        const formValidator = new FormValidator();
        const formBody = {
          _csrf: "abcdefg",
          "first-name": "a".repeat(101),
          "last-name": "a".repeat(101),
          "last-name-at-birth": "",
          "dob-day": "1",
          "dob-month": "1",
          "dob-year": "2010",
          "name-change": "false",
        };
        const errorSummaries = formValidator.validateClientName(formBody);
        assert.deepEqual(errorSummaries, {
          firstNameInputError: {
            text: CLIENT_DETAILS_ERROR.FIRST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
          },
          lastNameInputError: {
            text: CLIENT_DETAILS_ERROR.LAST_NAME_EXCEEDS_MAX_CHARACTER_LENGTH,
          },
        });
      });
    });
    describe("validateNino", () => {
      it("adds error message when no option is selected", () => {
        const formValidator = new FormValidator();
        const formBody = {
          _csrf: "abcdefg"
        };
        const errorSummaries = formValidator.validateNino(formBody);
        assert.deepEqual(errorSummaries, {
          noRadioSelected: {
            text: CLIENT_DETAILS_ERROR.INPUT_NOT_SELECTED,
          }
        });
      });
      it("adds error message when yes selected but no nino provided", () => {
        const formValidator = new FormValidator();
        const formBody = {
          _csrf: "abcdefg",
          "has-nino": "true",
          "nino-input": ""
        };
        const errorSummaries = formValidator.validateNino(formBody);
        assert.deepEqual(errorSummaries, {
          ninoInputError: {
            text: CLIENT_DETAILS_ERROR.MISSING_NINO,
          }
        });
      });

      it("adds error message when nino provided is invalid format", () => {
        const formValidator = new FormValidator();
        const formBody = {
          _csrf: "abcdefg",
          "has-nino": "true",
          "nino-input": "12345679"
        };
        const errorSummaries = formValidator.validateNino(formBody);
        assert.deepEqual(errorSummaries, {
          ninoInputError: {
            text: CLIENT_DETAILS_ERROR.INVALID_NINO,
          }
        });

      });

      const InvalidNinoTests = [
        { nino: "DF123456A", reason: "D and F cannot be in first 2 letters"},
        { nino: "FD123456A", reason: "D and F cannot be in first 2 letters" },
        { nino: "IQ123456A", reason: "I and Q cannot be in first 2 letters" },
        { nino: "QI123456A", reason: "I and Q cannot be in first 2 letters" },
        { nino: "UV123456A", reason: "U and V cannot be in first 2 letters" },
        { nino: "VU123456A", reason: "U and V cannot be in first 2 letters" },
        { nino: "BG123456A", reason: "BG cannot be prefix" },
        { nino: "GB123456A", reason: "GB cannot be prefix" },
        { nino: "NK123456A", reason: "NK cannot be prefix" },
        { nino: "KN123456A", reason: "KN cannot be prefix" },
        { nino: "TN123456A", reason: "TN cannot be prefix" },
        { nino: "NT123456A", reason: "NT cannot be prefix" },
        { nino: "ZZ123456A", reason: "ZZ cannot be prefix" },
        { nino: "PP123456E", reason: "A, B, C or D must be last letter"},
      ];

      InvalidNinoTests.forEach(({nino, reason}) => {
        it(`adds error message when nino provided is invalid due to ${reason}`, function () {
          
          const formValidator = new FormValidator();
          const formBody = {
            _csrf: "abcdefg",
            "has-nino": "true",
            "nino-input": nino
          };
          const errorSummaries = formValidator.validateNino(formBody);
          assert.deepEqual(errorSummaries, {
            ninoInputError: {
              text: CLIENT_DETAILS_ERROR.INVALID_NINO,
            }
          });

        });
      });

      const validNinoTests = [
        { nino: "PP123456A", reason: "A, B, C or D being last letter"},
        { nino: "PP123456B", reason: "A, B, C or D being last letter"},
        { nino: "PP123456C", reason: "A, B, C or D being last letter"},
        { nino: "PP123456D", reason: "A, B, C or D being last letter"},
      ];
      
      validNinoTests.forEach(({nino, reason}) => {
        it(`Nino is valid due to ${reason}`, function () {
          
          const formValidator = new FormValidator();
          const formBody = {
            _csrf: "abcdefg",
            "has-nino": "true",
            "nino-input": nino
          };
          const errorSummaries = formValidator.validateNino(formBody);
          assert.deepEqual(errorSummaries, {});
        });
      });

    });
    
  });
});
