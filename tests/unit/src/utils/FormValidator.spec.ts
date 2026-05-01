import { assert, expect } from "chai";
import { FormValidator } from "#src/utils/FormValidator.js";

describe("FormValidator", () => {
  describe("methods", () => {
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
        assert.deepEqual(formValidator.errorSummaries, {});
        formValidator.validateClientName(formBody);
        assert.deepEqual(formValidator.errorSummaries, {
          firstNameInputError: {
            text: "Please enter your client's first name",
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
        assert.deepEqual(formValidator.errorSummaries, {});
        formValidator.validateClientName(formBody);
        assert.deepEqual(formValidator.errorSummaries, {
          firstNameInputError: {
            text: "First name(s) cannot exceed 100 characters",
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
        assert.deepEqual(formValidator.errorSummaries, {});
        formValidator.validateClientName(formBody);
        assert.deepEqual(formValidator.errorSummaries, {
          lastNameInputError: { text: "Please enter your client's last name" },
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
        assert.deepEqual(formValidator.errorSummaries, {});
        formValidator.validateClientName(formBody);
        assert.deepEqual(formValidator.errorSummaries, {
          lastNameInputError: {
            text: "Last name cannot exceed 100 characters",
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
        assert.deepEqual(formValidator.errorSummaries, {});
        formValidator.validateClientName(formBody);
        assert.deepEqual(formValidator.errorSummaries, {
          noRadioSelected: { text: "Please select an option" },
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
        assert.deepEqual(formValidator.errorSummaries, {});
        formValidator.validateClientName(formBody);
        assert.deepEqual(formValidator.errorSummaries, {
          noBirthNameSpecified: {
            text: "Please enter the client's birth name",
          },
        });
      });
    });
  });
});
