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

    it("returns error when case reference is undefined", () => {
      const validator = new CaseSearchValidator();

      const errorSummaries = validator.validateCaseSearch({});

      assert.deepEqual(errorSummaries, {
        caseReferenceInputError: {
          text: CASE_SEARCH_ERROR.MISSING_CASE_REFERENCE,
        },
      });
    });
  });
});
