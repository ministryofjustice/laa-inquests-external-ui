import { strict as assert } from "assert";
import { UploadEvidenceValidator } from "#src/adaptors/presenters/claim/Evidence/Evidence.validator.js";
import { CLAIM_EVIDENCE_ERROR } from "#src/infrastructure/locales/constants.js";

describe("UploadEvidenceValidator", () => {
  describe("validateEvidenceSelection", () => {
    it("returns error when evidence files are undefined", () => {
      const validator = new UploadEvidenceValidator();

      const result = validator.validateEvidenceSelection(undefined);

      assert.deepEqual(result, {
        evidenceError: {
          text: CLAIM_EVIDENCE_ERROR.MINIMUM_ONE_FILE_REQUIRED,
        },
      });
    });

    it("returns error when evidence files are empty", () => {
      const validator = new UploadEvidenceValidator();

      const result = validator.validateEvidenceSelection([]);

      assert.deepEqual(result, {
        evidenceError: {
          text: CLAIM_EVIDENCE_ERROR.MINIMUM_ONE_FILE_REQUIRED,
        },
      });
    });

    it("returns no error when at least one evidence file exists", () => {
      const validator = new UploadEvidenceValidator();

      const result = validator.validateEvidenceSelection([
        { id: "file-id-123", fileName: "test-evidence.pdf" },
      ]);

      assert.deepEqual(result, {});
    });
  });
});
