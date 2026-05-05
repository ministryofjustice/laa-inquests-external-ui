import { assert, expect } from "chai";
import { FormValidator } from "#src/utils/FormValidator.js";

describe("FormValidator", () => {
  describe("methods", () => {
    (describe("validateClientDob", () => {
      (it("adds error when day in dob is not provided", () => {
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
        assert.deepEqual(formValidator.errorSummaries, {});
        formValidator.validateClientDob(formBody);
        assert.deepEqual(formValidator.errorSummaries, {
          dobInputError: {
            text: "Please enter date of birth",
          },
        });
      }),
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
          assert.deepEqual(formValidator.errorSummaries, {});
          formValidator.validateClientDob(formBody);
          assert.deepEqual(formValidator.errorSummaries, {
            dobInputError: {
              text: "Please enter date of birth",
            },
          });
        }),
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
          assert.deepEqual(formValidator.errorSummaries, {});
          formValidator.validateClientDob(formBody);
          assert.deepEqual(formValidator.errorSummaries, {
            dobInputError: {
              text: "Please enter date of birth",
            },
          });
        }));
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
        assert.deepEqual(formValidator.errorSummaries, {});
        formValidator.validateClientDob(formBody);
        assert.deepEqual(formValidator.errorSummaries, {
          dobInputError: {
            text: "Please enter date of birth in the format expected",
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
        assert.deepEqual(formValidator.errorSummaries, {});
        formValidator.validateClientDob(formBody);
        assert.deepEqual(formValidator.errorSummaries, {
          dobInputError: {
            text: "Date of birth must not be in the future",
          },
        });
      });
    }),
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
            lastNameInputError: {
              text: "Please enter your client's last name",
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
          assert.deepEqual(formValidator.errorSummaries, {});
          formValidator.validateClientName(formBody);
          assert.deepEqual(formValidator.errorSummaries, {
            firstNameInputError: {
              text: "Please enter your client's first name",
            },
            lastNameInputError: {
              text: "Please enter your client's last name",
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
          assert.deepEqual(formValidator.errorSummaries, {});
          formValidator.validateClientName(formBody);
          assert.deepEqual(formValidator.errorSummaries, {
            firstNameInputError: {
              text: "First name(s) cannot exceed 100 characters",
            },
            lastNameInputError: {
              text: "Last name cannot exceed 100 characters",
            },
          });
        });
      }));
  });
});
