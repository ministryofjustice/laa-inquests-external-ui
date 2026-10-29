import { strict as assert } from "assert";
import { UploadEvidenceValidator } from "#src/adaptors/presenters/claim/Evidence/Evidence.validator.js";
import { CLAIM_EVIDENCE_ERROR } from "#src/infrastructure/locales/constants.js";

describe("UploadEvidenceValidator", () => {
  describe("validateEvidenceUploadFile", () => {
    it("names the invalid empty file", () => {
      const validator = new UploadEvidenceValidator();
      const file = {
        mimetype: "application/pdf",
        originalname: "test-evidence.pdf",
        size: 0,
      } as Express.Multer.File;

      const result = validator.validateEvidenceUploadFile(file);

      assert.deepEqual(result, {
        evidenceError: {
          text: "test-evidence.pdf is empty",
        },
      });
    });

    it("names the invalid file when its size exceeds 10MB", () => {
      const validator = new UploadEvidenceValidator();
      const file = {
        mimetype: "application/pdf",
        originalname: "test-evidence.pdf",
        size: 11 * 1024 * 1024,
      } as Express.Multer.File;

      const result = validator.validateEvidenceUploadFile(file);

      assert.deepEqual(result, {
        evidenceError: {
          text: "test-evidence.pdf must be smaller than 10MB",
        },
      });
    });

    it("names the invalid file and returns the type error before the size error", () => {
      const validator = new UploadEvidenceValidator();
      const file = {
        mimetype: "application/octet-stream",
        originalname: "file1.exe",
        size: 11 * 1024 * 1024,
      } as Express.Multer.File;

      const result = validator.validateEvidenceUploadFile(file);

      assert.deepEqual(result, {
        evidenceError: {
          text: "file1.exe must be a JPG, PNG, BMP or PDF",
        },
      });
    });
  });

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
