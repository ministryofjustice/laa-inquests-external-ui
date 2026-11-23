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

  describe("validateEvidenceUploadFile", () => {
    const file = (originalname: string): Express.Multer.File =>
      ({
        originalname,
        mimetype: "application/pdf",
        size: 1024,
      }) as Express.Multer.File;

    it("accepts a file whose name uses only allowed characters", () => {
      const result = new UploadEvidenceValidator().validateEvidenceUploadFile(
        file("evidence (1)!_final-v2.pdf"),
      );

      assert.deepEqual(result, {});
    });

    for (const originalname of [
      "<img src=x onerror=alert(1)>.pdf",
      "x' onmouseover='alert(1).pdf",
      "C:\\fakepath\\evidence.pdf",
    ]) {
      it(`rejects the file name ${JSON.stringify(originalname)} even though the request bypassed the browser`, () => {
        const result = new UploadEvidenceValidator().validateEvidenceUploadFile(
          file(originalname),
        );

        assert.deepEqual(result, {
          evidenceError: {
            text: `${originalname} has an invalid filename. Filenames should only include the letters a-z and A-Z, numbers 0-9, spaces, and the characters .!()_-`,
          },
        });
      });
    }
  });
});
