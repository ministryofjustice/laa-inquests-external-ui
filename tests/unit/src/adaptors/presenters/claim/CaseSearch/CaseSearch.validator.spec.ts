import { strict as assert } from "assert";
import { CaseSearchValidator } from "#src/adaptors/presenters/claim/CaseSearch/CaseSearch.validator.js";
import { CASE_SEARCH_ERROR } from "#src/infrastructure/locales/constants.js";

describe("CaseSearchValidator", () => {
  describe("validateCaseSearch", () => {
    it("returns error when case reference is empty", () => {
      const validator = new CaseSearchValidator();

      const errorSummaries = validator.validateCaseSearch({
        "case-reference": "",
      });

      assert.deepEqual(errorSummaries, {
        caseReferenceInputError: {
          text: CASE_SEARCH_ERROR.MISSING_CASE_REFERENCE,
        },
      });
    });

    it("returns empty error object when case reference is provided", () => {
      const validator = new CaseSearchValidator();

      const errorSummaries = validator.validateCaseSearch({
        "case-reference": "ABC-12345",
      });

      assert.deepEqual(errorSummaries, {});
    });

    it("returns error when case reference is only whitespace", () => {
      const validator = new CaseSearchValidator();

      const errorSummaries = validator.validateCaseSearch({
        "case-reference": "   ",
      });

      assert.deepEqual(errorSummaries, {
        caseReferenceInputError: {
          text: CASE_SEARCH_ERROR.MISSING_CASE_REFERENCE,
        },
      });
    });

    it("accepts references that are not in the usual format so a typo shows no results", () => {
      const validator = new CaseSearchValidator();

      ["inq abc 123!?#", "Zoë-1", "a".repeat(50)].forEach((value) => {
        assert.deepEqual(
          validator.validateCaseSearch({ "case-reference": value }),
          {},
          JSON.stringify(value),
        );
      });
    });

    it("returns error when case reference exceeds 50 characters", () => {
      const validator = new CaseSearchValidator();

      const errorSummaries = validator.validateCaseSearch({
        "case-reference": "a".repeat(51),
      });

      assert.deepEqual(errorSummaries, {
        caseReferenceInputError: {
          text: CASE_SEARCH_ERROR.CASE_REFERENCE_EXCEEDS_MAX_CHARACTER_LENGTH,
        },
      });
    });

    it("counts the value as sent to the API, so padding past 50 characters is rejected", () => {
      const validator = new CaseSearchValidator();

      const errorSummaries = validator.validateCaseSearch({
        "case-reference": `${"a".repeat(50)} `,
      });

      assert.deepEqual(errorSummaries, {
        caseReferenceInputError: {
          text: CASE_SEARCH_ERROR.CASE_REFERENCE_EXCEEDS_MAX_CHARACTER_LENGTH,
        },
      });
    });

    [
      ["a newline", "INQ\n1"],
      ["a tab", "INQ\t1"],
      ["a null byte", "INQ\u00001"],
      ["a zero-width character", "INQ\u200b1"],
      ["a right-to-left override", "\u202eINQ1"],
    ].forEach(([reason, value]) => {
      it(`returns error when case reference contains ${reason}`, () => {
        const validator = new CaseSearchValidator();

        const errorSummaries = validator.validateCaseSearch({
          "case-reference": value,
        });

        assert.deepEqual(errorSummaries, {
          caseReferenceInputError: {
            text: CASE_SEARCH_ERROR.CASE_REFERENCE_INVALID_CHARACTERS,
          },
        });
      });
    });
  });
});
