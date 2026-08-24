import { strict as assert } from "assert";
import { EndDateValidator } from "#src/adaptors/presenters/claim/EndDate/EndDate.validator.js";
import { END_DATE_ERROR } from "#src/infrastructure/locales/constants.js";

describe("EndDate validator", () => {
  describe("validateEndDate", () => {
    it("returns a missing error when all fields are empty", () => {
      const validator = new EndDateValidator();

      const errors = validator.validateEndDate({
        "end-date-day": "",
        "end-date-month": "",
        "end-date-year": "",
      });

      assert.deepEqual(errors, {
        endDateInputError: { text: END_DATE_ERROR.MISSING_END_DATE },
      });
    });

    it("returns a missing error when some fields are empty", () => {
      const validator = new EndDateValidator();

      const errors = validator.validateEndDate({
        "end-date-day": "21",
        "end-date-month": "",
        "end-date-year": "2026",
      });

      assert.deepEqual(errors, {
        endDateInputError: { text: END_DATE_ERROR.MISSING_END_DATE },
      });
    });

    it("returns a non-numeric error when fields contain non-numeric values", () => {
      const validator = new EndDateValidator();

      const errors = validator.validateEndDate({
        "end-date-day": "aa",
        "end-date-month": "bb",
        "end-date-year": "cccc",
      });

      assert.deepEqual(errors, {
        endDateInputError: { text: END_DATE_ERROR.NON_NUMERIC_END_DATE },
      });
    });

    it("returns an invalid date error when the date does not exist", () => {
      const validator = new EndDateValidator();

      const errors = validator.validateEndDate({
        "end-date-day": "32",
        "end-date-month": "13",
        "end-date-year": "2025",
      });

      assert.deepEqual(errors, {
        endDateInputError: { text: END_DATE_ERROR.INVALID_END_DATE },
      });
    });

    it("returns a future/today error when the date is today", () => {
      const validator = new EndDateValidator();
      const today = new Date();

      const errors = validator.validateEndDate({
        "end-date-day": String(today.getDate()),
        "end-date-month": String(today.getMonth() + 1),
        "end-date-year": String(today.getFullYear()),
      });

      assert.deepEqual(errors, {
        endDateInputError: { text: END_DATE_ERROR.FUTURE_OR_TODAY_END_DATE },
      });
    });

    it("returns a future/today error when the date is in the future", () => {
      const validator = new EndDateValidator();

      const errors = validator.validateEndDate({
        "end-date-day": "1",
        "end-date-month": "1",
        "end-date-year": "2099",
      });

      assert.deepEqual(errors, {
        endDateInputError: { text: END_DATE_ERROR.FUTURE_OR_TODAY_END_DATE },
      });
    });

    it("returns no errors when the date is a valid date in the past", () => {
      const validator = new EndDateValidator();

      const errors = validator.validateEndDate({
        "end-date-day": "21",
        "end-date-month": "3",
        "end-date-year": "2026",
      });

      assert.deepEqual(errors, {});
    });

    it("returns no errors when the date is yesterday", () => {
      const validator = new EndDateValidator();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const errors = validator.validateEndDate({
        "end-date-day": String(yesterday.getDate()),
        "end-date-month": String(yesterday.getMonth() + 1),
        "end-date-year": String(yesterday.getFullYear()),
      });

      assert.deepEqual(errors, {});
    });
  });
});
